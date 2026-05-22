import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { logger, validateEventEnvelopeV1, sendError, createEventEnvelopeV1 } from "@lframework/shared";
import type { PrismaEventRepository } from "../../driven/persistence/prisma-event.repository";
import type { IntegrationMetrics } from "../../../application/metrics";

function resolveApiKey(req: Request): string | null {
  const value = req.headers["x-api-key"];
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === "string" ? value : null;
}

function isValidationLikeError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const maybe = err as { name?: unknown; issues?: unknown };
  if (maybe.name === "ZodError") return true;
  return Array.isArray(maybe.issues);
}

export function createIntegrationRoutes(
  repository: PrismaEventRepository,
  metrics: IntegrationMetrics,
  integrationApiKey: string
): Router {
  const router = Router();

  const limiter = rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const apiKey = resolveApiKey(req) ?? "no-key";
      return `${req.ip}:${apiKey}`;
    },
    handler: (_req, res) => {
      metrics.rateLimitedTotal.inc();
      sendError(res, 429, "Too many requests");
    },
  });

  router.post("/integrations/events", limiter, async (req: Request, res: Response) => {
    metrics.eventsReceivedTotal.inc();
    const correlationId = resolveCorrelationId(req);
    const startedAt = Date.now();

    const apiKey = resolveApiKey(req);
    if (!apiKey || apiKey !== integrationApiKey) {
      metrics.eventsRejectedTotal.inc();
      const responseStatus = 401;
      await tryAppendAuditEvent(repository, {
        type: "integration.audit.rejected",
        correlationId,
        payload: buildIntegrationAuditPayload(req, {
          reason: "unauthorized",
          responseStatus,
          responseTimeMs: Date.now() - startedAt,
        }),
      });
      sendError(res, responseStatus, "Unauthorized");
      return;
    }

    try {
      const envelope = validateEventEnvelopeV1(req.body);
      const result = await repository.storeInboundAndOutbox(envelope);
      if (result.duplicate) {
        metrics.eventsDuplicateTotal.inc();
        const responseStatus = 200;
        await tryAppendAuditEvent(repository, {
          type: "integration.audit.duplicate",
          correlationId: envelope.correlationId,
          payload: buildIntegrationAuditPayload(req, {
            sourceEventId: envelope.eventId,
            sourceEventType: envelope.type,
            producer: envelope.producer,
            responseStatus,
            responseTimeMs: Date.now() - startedAt,
          }),
        });
        res.status(responseStatus).json({ accepted: true, duplicate: true, eventId: envelope.eventId });
        return;
      }

      metrics.eventsAcceptedTotal.inc();
      const responseStatus = 202;
      await tryAppendAuditEvent(repository, {
        type: "integration.audit.accepted",
        correlationId: envelope.correlationId,
        payload: buildIntegrationAuditPayload(req, {
          sourceEventId: envelope.eventId,
          sourceEventType: envelope.type,
          producer: envelope.producer,
          responseStatus,
          responseTimeMs: Date.now() - startedAt,
        }),
      });
      res.status(responseStatus).json({ accepted: true, duplicate: false, eventId: envelope.eventId });
    } catch (err) {
      if (isValidationLikeError(err)) {
        metrics.eventsRejectedTotal.inc();
        logger.warn({ err }, "Invalid inbound integration event");
        const responseStatus = 400;
        await tryAppendAuditEvent(repository, {
          type: "integration.audit.rejected",
          correlationId,
          payload: buildIntegrationAuditPayload(req, {
            reason: "invalid_envelope",
            responseStatus,
            responseTimeMs: Date.now() - startedAt,
          }),
        });
        sendError(res, responseStatus, "Invalid event envelope");
        return;
      }

      logger.error({ err }, "Integration repository failure while persisting inbound event");
      const responseStatus = 500;
      await tryAppendAuditEvent(repository, {
        type: "integration.audit.rejected",
        correlationId,
        payload: buildIntegrationAuditPayload(req, {
          reason: "repository_failure",
          responseStatus,
          responseTimeMs: Date.now() - startedAt,
        }),
      });
      sendError(res, responseStatus, "Internal server error");
    }
  });

  return router;
}

function resolveCorrelationId(req: Request): string {
  const value = req.headers["x-correlation-id"];
  if (Array.isArray(value)) return value[0] ?? "";
  if (typeof value === "string") return value;
  return "";
}

function buildIntegrationAuditPayload(
  req: Request,
  payload: Record<string, unknown>
): Record<string, unknown> {
  return {
    path: req.path,
    method: req.method,
    ...payload,
  };
}

async function tryAppendAuditEvent(
  repository: PrismaEventRepository,
  params: {
    type: string;
    correlationId?: string;
    payload: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await repository.appendAuditEvent(
      createEventEnvelopeV1({
        type: params.type,
        producer: "integration-service",
        correlationId: params.correlationId,
        payload: params.payload,
      })
    );
  } catch (err) {
    logger.warn({ err, type: params.type }, "Failed to append integration audit event");
  }
}

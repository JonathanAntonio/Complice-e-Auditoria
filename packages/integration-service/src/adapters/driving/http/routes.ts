import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { logger, validateEventEnvelopeV1, sendError } from "@lframework/shared";
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

    const apiKey = resolveApiKey(req);
    if (!apiKey || apiKey !== integrationApiKey) {
      metrics.eventsRejectedTotal.inc();
      sendError(res, 401, "Unauthorized");
      return;
    }

    try {
      const envelope = validateEventEnvelopeV1(req.body);
      const result = await repository.storeInboundAndOutbox(envelope);
      if (result.duplicate) {
        metrics.eventsDuplicateTotal.inc();
        res.status(200).json({ accepted: true, duplicate: true, eventId: envelope.eventId });
        return;
      }

      metrics.eventsAcceptedTotal.inc();
      res.status(202).json({ accepted: true, duplicate: false, eventId: envelope.eventId });
    } catch (err) {
      if (isValidationLikeError(err)) {
        metrics.eventsRejectedTotal.inc();
        logger.warn({ err }, "Invalid inbound integration event");
        sendError(res, 400, "Invalid event envelope");
        return;
      }

      logger.error({ err }, "Integration repository failure while persisting inbound event");
      sendError(res, 500, "Internal server error");
    }
  });

  return router;
}

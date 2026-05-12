import type { Request, Response } from "express";
import type { MessagingFlowFilters, MessagingFlowService } from "../../../application/messaging-flow.service";
import { DownstreamHttpError } from "../../driven/http/downstream.client";

export class MessagingFlowController {
  constructor(private readonly messagingFlowService: MessagingFlowService) {}

  get = async (req: Request, res: Response): Promise<void> => {
    const authorization = readAuthorization(req);
    const filters = parseFilters(req);
    try {
      const snapshot = await this.messagingFlowService.getSnapshot(authorization, filters);
      res.json(snapshot);
    } catch (err) {
      if (err instanceof DownstreamHttpError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      throw err;
    }
  };
}

function parseFilters(req: Request): MessagingFlowFilters {
  const sourceService = readString(req.query.sourceService);
  const eventType = readString(req.query.eventType);
  const correlationId = readString(req.query.correlationId);
  const notificationStatus = readString(req.query.notificationStatus);
  const onlyFailures = readBoolean(req.query.onlyFailures);
  const auditLimit = readPositiveInt(req.query.auditLimit);
  const failuresLimit = readPositiveInt(req.query.failuresLimit);

  return {
    sourceService,
    eventType,
    correlationId,
    notificationStatus: notificationStatus === "sent" || notificationStatus === "failed" || notificationStatus === "dead_letter"
      ? notificationStatus
      : undefined,
    onlyFailures,
    auditLimit,
    failuresLimit,
  };
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  if (typeof value !== "string") return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function readPositiveInt(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
  return parsed;
}

function readAuthorization(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (typeof header !== "string" || header.trim().length === 0) return undefined;
  return header;
}

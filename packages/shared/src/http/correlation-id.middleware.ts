import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

const HEADER_NAME = "x-correlation-id";
const REQUEST_ID_HEADER = "x-request-id";
const MAX_HEADER_LENGTH = 256;

export interface RequestWithCorrelationId extends Request {
  correlationId?: string;
}

export function correlationIdMiddleware(
  req: RequestWithCorrelationId,
  res: Response,
  next: NextFunction
): void {
  const correlationValue = req.headers[HEADER_NAME];
  const requestIdValue = req.headers[REQUEST_ID_HEADER];
  const raw = Array.isArray(correlationValue)
    ? correlationValue[0]
    : (correlationValue ?? (Array.isArray(requestIdValue) ? requestIdValue[0] : requestIdValue));
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  const correlationId =
    trimmed.length > 0 && trimmed.length <= MAX_HEADER_LENGTH
      ? trimmed
      : randomUUID();

  req.correlationId = correlationId;
  res.setHeader(HEADER_NAME, correlationId);
  next();
}

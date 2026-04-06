import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";
import type { RequestWithRequestId } from "./request-id.middleware";
import type { RequestWithCorrelationId } from "./correlation-id.middleware";

/**
 * Middleware that logs each HTTP request when the response finishes.
 * Logs: method, path, statusCode, durationMs, and requestId when present.
 * Must be used after requestIdMiddleware so requestId is available.
 */
export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const requestId = (req as RequestWithRequestId).requestId;
  const correlationId = (req as RequestWithCorrelationId).correlationId;
  const logContext: Record<string, string> = {};
  if (requestId) logContext.requestId = requestId;
  if (correlationId) logContext.correlationId = correlationId;
  const log = Object.keys(logContext).length > 0 ? logger.child(logContext) : logger;

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    log.info(
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs,
      },
      "request"
    );
  });

  next();
}

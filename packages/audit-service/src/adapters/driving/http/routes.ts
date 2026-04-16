import { Router, type NextFunction, type Request, type Response } from "express";
import { asyncHandler } from "@lframework/shared";
import type { AuditLogsController } from "./audit-logs.controller";

export function createAuditRoutes(
  controller: AuditLogsController,
  authMiddleware: (req: Request, res: Response, next: NextFunction) => void,
  requireAuditLogsRead: (req: Request, res: Response, next: NextFunction) => void,
): Router {
  const router = Router();

  router.get("/audit/logs", authMiddleware, requireAuditLogsRead, asyncHandler(controller.list.bind(controller)));
  router.get(
    "/audit/retention/runs",
    authMiddleware,
    requireAuditLogsRead,
    asyncHandler(controller.listRetentionRuns.bind(controller))
  );

  return router;
}

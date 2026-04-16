import { Router, Request, Response, NextFunction } from "express";
import { asyncHandler } from "@lframework/shared";
import { ItemController } from "./item.controller";
import { RetentionRunsController } from "./retention-runs.controller";
import { validateCreateItem, validateUpdateItem } from "./item.validation";

/**
 * Política de acesso: GET /api/violations exige autenticação e permissão de leitura.
 * POST /api/violations exige autenticação e permissão de criação.
 */
export function createItemRoutes(
  controller: ItemController,
  retentionRunsController: RetentionRunsController,
  authMiddleware: (req: Request, res: Response, next: NextFunction) => void,
  requireItemsRead: (req: Request, res: Response, next: NextFunction) => void,
  requireItemsCreate: (req: Request, res: Response, next: NextFunction) => void,
  requireComplianceTestAccess: (req: Request, res: Response, next: NextFunction) => void
): Router {
  const router = Router();
  router.get("/violations", authMiddleware, requireItemsRead, asyncHandler(controller.list.bind(controller)));
  router.get(
    "/violations/test-permission",
    authMiddleware,
    requireComplianceTestAccess,
    asyncHandler(controller.testPermission.bind(controller))
  );
  router.post(
    "/violations",
    authMiddleware,
    requireItemsCreate,
    validateCreateItem,
    asyncHandler(controller.create.bind(controller))
  );
  router.patch(
    "/violations/:violationId",
    authMiddleware,
    requireItemsCreate,
    validateUpdateItem,
    asyncHandler(controller.update.bind(controller))
  );
  router.get(
    "/retention/runs",
    authMiddleware,
    requireItemsRead,
    asyncHandler(retentionRunsController.list.bind(retentionRunsController))
  );
  return router;
}

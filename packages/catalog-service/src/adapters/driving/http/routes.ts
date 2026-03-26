import { Router, Request, Response, NextFunction } from "express";
import { asyncHandler } from "@lframework/shared";
import { ItemController } from "./item.controller";
import { validateCreateItem } from "./item.validation";

/**
 * Política de acesso: GET /api/items é público (listagem).
 * POST /api/items exige autenticação JWT (apenas usuários autenticados podem criar itens).
 */
export function createItemRoutes(
  controller: ItemController,
  authMiddleware: (req: Request, res: Response, next: NextFunction) => void,
  requireItemsRead: (req: Request, res: Response, next: NextFunction) => void,
  requireItemsCreate: (req: Request, res: Response, next: NextFunction) => void,
  requireCatalogTestAccess: (req: Request, res: Response, next: NextFunction) => void
): Router {
  const router = Router();
  router.get("/items", authMiddleware, requireItemsRead, asyncHandler(controller.list.bind(controller)));
  router.get(
    "/items/test-permission",
    authMiddleware,
    requireCatalogTestAccess,
    asyncHandler(controller.testPermission.bind(controller))
  );
  router.post(
    "/items",
    authMiddleware,
    requireItemsCreate,
    validateCreateItem,
    asyncHandler(controller.create.bind(controller))
  );
  return router;
}

import { Router, Request, Response, NextFunction } from "express";
import { asyncHandler } from "@lframework/shared";
import { UserController } from "./user.controller";
import {
  validateAssignUserRole,
  validateAssignUserRoles,
  validateCreateUser,
} from "./user.validation";

export function createUserRoutes(
  controller: UserController,
  authMiddleware: (req: Request, res: Response, next: NextFunction) => void,
  requireUsersCreate: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  requireUsersRead: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  requireRolesAssign: (req: Request, res: Response, next: NextFunction) => Promise<void>
): Router {
  const router = Router();
  router.post(
    "/users",
    authMiddleware,
    validateCreateUser,
    asyncHandler(requireUsersCreate),
    asyncHandler(controller.create.bind(controller))
  );
  router.get(
    "/users/:id",
    authMiddleware,
    asyncHandler(requireUsersRead),
    asyncHandler(controller.getById.bind(controller))
  );
  router.put(
    "/users/:id/role",
    authMiddleware,
    validateAssignUserRole,
    asyncHandler(requireRolesAssign),
    asyncHandler(controller.assignLegacyRole.bind(controller))
  );
  router.put(
    "/users/:id/roles",
    authMiddleware,
    validateAssignUserRoles,
    asyncHandler(requireRolesAssign),
    asyncHandler(controller.assignRoles.bind(controller))
  );
  return router;
}

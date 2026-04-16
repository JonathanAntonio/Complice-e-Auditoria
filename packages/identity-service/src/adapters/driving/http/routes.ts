import { Router, Request, Response, NextFunction } from "express";
import { asyncHandler } from "@lframework/shared";
import { UserController } from "./user.controller";
import {
  validateAssignUserRole,
  validateAssignUserRoles,
  validateCreateUser,
  validateUpdateUserSecurity,
} from "./user.validation";

export function createUserRoutes(
  controller: UserController,
  authMiddleware: (req: Request, res: Response, next: NextFunction) => void,
  requireUsersCreate: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  requireUsersReadAny: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  requireUsersRead: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  requireRolesAssign: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  requireUsersUpdate: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  requireUsersDeactivate: (req: Request, res: Response, next: NextFunction) => Promise<void>
): Router {
  const router = Router();
  router.get(
    "/users",
    authMiddleware,
    asyncHandler(requireUsersReadAny),
    asyncHandler(controller.list.bind(controller))
  );
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
  router.patch(
    "/users/:id/security",
    authMiddleware,
    validateUpdateUserSecurity,
    asyncHandler(requireUsersUpdate),
    asyncHandler(controller.updateSecurity.bind(controller))
  );
  router.delete(
    "/users/:id",
    authMiddleware,
    asyncHandler(requireUsersDeactivate),
    asyncHandler(controller.deactivate.bind(controller))
  );
  return router;
}

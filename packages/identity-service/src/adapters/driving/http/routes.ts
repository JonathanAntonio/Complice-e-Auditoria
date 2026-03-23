import { Router, Request, Response, NextFunction } from "express";
import { asyncHandler } from "@lframework/shared";
import { UserController } from "./user.controller";
import { validateAssignUserRole, validateCreateUser } from "./user.validation";

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
    validateCreateUser,
    authMiddleware,
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
    validateAssignUserRole,
    authMiddleware,
    asyncHandler(requireRolesAssign),
    asyncHandler(controller.assignRole.bind(controller))
  );
  return router;
}

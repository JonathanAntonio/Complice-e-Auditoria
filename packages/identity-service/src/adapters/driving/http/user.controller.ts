import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CreateUserUseCase } from "../../../application/use-cases/create-user.use-case";
import { GetUserByIdUseCase } from "../../../application/use-cases/get-user-by-id.use-case";
import { AssignUserRolesUseCase } from "../../../application/use-cases/assign-user-role.use-case";
import type { CreateUserDto } from "../../../application/dtos/create-user.dto";
import {
  assignUserRoleSchema,
  assignUserRolesSchema,
} from "../../../application/dtos/assign-user-role.dto";
import type { AuthenticatedRequest } from "@lframework/shared";
import { sendError } from "@lframework/shared";
import { PERMISSIONS } from "../../../domain/types";

const uuidParamSchema = z.string().uuid();

/**
 * Adapter (entrada): controller HTTP que delega aos casos de uso.
 * Rotas protegidas por authMiddleware e auditoria explícita de access denied.
 */
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly assignUserRolesUseCase: AssignUserRolesUseCase
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const dto: CreateUserDto = authReq.body;
      const result = await this.createUserUseCase.execute(dto);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.userId) {
        sendError(res, 403, "Forbidden");
        return;
      }

      const { id } = authReq.params;
      const parsed = uuidParamSchema.safeParse(id);
      if (!parsed.success) {
        sendError(res, 400, "Invalid user id format");
        return;
      }
      const userId = parsed.data;
      const userPermissions = Array.isArray(authReq.userPermissions) ? authReq.userPermissions : [];
      const canReadTarget =
        authReq.userId === userId ||
        userPermissions.includes(PERMISSIONS.USERS_READ_ANY);
      if (!canReadTarget) {
        sendError(res, 403, "Forbidden");
        return;
      }

      const user = await this.getUserByIdUseCase.execute(userId);
      if (!user) {
        sendError(res, 404, "User not found");
        return;
      }
      res.json(user);
    } catch (err) {
      next(err);
    }
  };

  assignLegacyRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.userId) {
        sendError(res, 403, "Forbidden");
        return;
      }
      const userPermissions = Array.isArray(authReq.userPermissions) ? authReq.userPermissions : [];
      if (!userPermissions.includes(PERMISSIONS.ROLES_ASSIGN)) {
        sendError(res, 403, "Forbidden");
        return;
      }

      const parsed = uuidParamSchema.safeParse(authReq.params.id);
      if (!parsed.success) {
        sendError(res, 400, "Invalid user id format");
        return;
      }

      const bodyParsed = assignUserRoleSchema.safeParse(authReq.body);
      if (!bodyParsed.success) {
        sendError(res, 400, "Invalid request body");
        return;
      }

      const user = await this.assignUserRolesUseCase.execute(
        parsed.data,
        { primaryRole: bodyParsed.data.primaryRole, roles: [bodyParsed.data.primaryRole] },
        authReq.userId
      );
      if (!user) {
        sendError(res, 404, "User not found");
        return;
      }

      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  };

  assignRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.userId) {
        sendError(res, 403, "Forbidden");
        return;
      }
      const userPermissions = Array.isArray(authReq.userPermissions) ? authReq.userPermissions : [];
      if (!userPermissions.includes(PERMISSIONS.ROLES_ASSIGN)) {
        sendError(res, 403, "Forbidden");
        return;
      }

      const parsed = uuidParamSchema.safeParse(authReq.params.id);
      if (!parsed.success) {
        sendError(res, 400, "Invalid user id format");
        return;
      }

      const bodyParsed = assignUserRolesSchema.safeParse(authReq.body);
      if (!bodyParsed.success) {
        sendError(res, 400, "Invalid request body");
        return;
      }

      const user = await this.assignUserRolesUseCase.execute(
        parsed.data,
        bodyParsed.data,
        authReq.userId
      );
      if (!user) {
        sendError(res, 404, "User not found");
        return;
      }

      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  };
}

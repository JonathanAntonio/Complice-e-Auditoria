import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CreateUserUseCase } from "../../../application/use-cases/create-user.use-case";
import { GetUserByIdUseCase } from "../../../application/use-cases/get-user-by-id.use-case";
import { ListUsersUseCase } from "../../../application/use-cases/list-users.use-case";
import { AssignUserRolesUseCase } from "../../../application/use-cases/assign-user-role.use-case";
import type { UpdateUserSecurityUseCase } from "../../../application/use-cases/update-user-security.use-case";
import type { DeactivateUserUseCase } from "../../../application/use-cases/deactivate-user.use-case";
import type { CreateUserDto } from "../../../application/dtos/create-user.dto";
import { parseListUsersQuery } from "../../../application/dtos/list-users-query.dto";
import {
  assignUserRoleSchema,
  assignUserRolesSchema,
} from "../../../application/dtos/assign-user-role.dto";
import {
  toUpdateUserSecurityDto,
  updateUserSecuritySchema,
} from "../../../application/dtos/update-user-security.dto";
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
    private readonly assignUserRolesUseCase: AssignUserRolesUseCase,
    private readonly listUsersUseCase?: ListUsersUseCase,
    private readonly updateUserSecurityUseCase?: UpdateUserSecurityUseCase,
    private readonly deactivateUserUseCase?: DeactivateUserUseCase
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

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.userId) {
        sendError(res, 403, "Forbidden");
        return;
      }
      if (!this.listUsersUseCase) {
        sendError(res, 503, "User list is not available");
        return;
      }
      const query = parseListUsersQuery(authReq.query);
      const result = await this.listUsersUseCase.execute(query);
      res.status(200).json(result);
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

  updateSecurity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.userId) {
        sendError(res, 403, "Forbidden");
        return;
      }
      if (!this.updateUserSecurityUseCase) {
        sendError(res, 503, "User security update is not available");
        return;
      }
      const userPermissions = Array.isArray(authReq.userPermissions) ? authReq.userPermissions : [];
      if (!userPermissions.includes(PERMISSIONS.USERS_UPDATE)) {
        sendError(res, 403, "Forbidden");
        return;
      }

      const parsed = uuidParamSchema.safeParse(authReq.params.id);
      if (!parsed.success) {
        sendError(res, 400, "Invalid user id format");
        return;
      }

      const bodyParsed = updateUserSecuritySchema.safeParse(authReq.body);
      if (!bodyParsed.success) {
        sendError(res, 400, "Invalid request body");
        return;
      }

      const user = await this.updateUserSecurityUseCase.execute(
        parsed.data,
        toUpdateUserSecurityDto(bodyParsed.data),
        authReq.userId,
        this.buildAuditContext(req)
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

  deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.userId) {
        sendError(res, 403, "Forbidden");
        return;
      }
      if (!this.deactivateUserUseCase) {
        sendError(res, 503, "User deactivation is not available");
        return;
      }
      const userPermissions = Array.isArray(authReq.userPermissions) ? authReq.userPermissions : [];
      if (!userPermissions.includes(PERMISSIONS.USERS_DEACTIVATE)) {
        sendError(res, 403, "Forbidden");
        return;
      }

      const parsed = uuidParamSchema.safeParse(authReq.params.id);
      if (!parsed.success) {
        sendError(res, 400, "Invalid user id format");
        return;
      }

      const user = await this.deactivateUserUseCase.execute(
        parsed.data,
        authReq.userId,
        this.buildAuditContext(req)
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

  private buildAuditContext(req: Request): { ipAddress?: string; requestId?: string; correlationId?: string; userAgent?: string } {
    const forwardedFor = req.headers["x-forwarded-for"];
    const forwardedIp = typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : undefined;
    return {
      ipAddress: forwardedIp || req.ip,
      requestId: req.headers["x-request-id"]?.toString(),
      correlationId: req.headers["x-correlation-id"]?.toString() ?? req.headers["x-request-id"]?.toString(),
      userAgent: req.headers["user-agent"]?.toString(),
    };
  }
}

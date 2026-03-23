import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CreateUserUseCase } from "../../../application/use-cases/create-user.use-case";
import { GetUserByIdUseCase } from "../../../application/use-cases/get-user-by-id.use-case";
import { AssignUserRoleUseCase } from "../../../application/use-cases/assign-user-role.use-case";
import type { CreateUserDto } from "../../../application/dtos/create-user.dto";
import { assignUserRoleSchema } from "../../../application/dtos/assign-user-role.dto";
import type { AuthenticatedRequest } from "@lframework/shared";
import { sendError } from "@lframework/shared";
import { USER_ROLES } from "../../../domain/types";

const uuidParamSchema = z.string().uuid();

/**
 * Adapter (entrada): controller HTTP que delega aos casos de uso.
 * Rotas protegidas por authMiddleware e auditoria explícita de access denied.
 */
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly assignUserRoleUseCase: AssignUserRoleUseCase
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
      const requesterRole = authReq.userPrimaryRole ?? authReq.userRole;
      const canReadTarget =
        requesterRole === USER_ROLES.ADMINISTRADOR || authReq.userId === userId;
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

  assignRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.userId) {
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

      const user = await this.assignUserRoleUseCase.execute(
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

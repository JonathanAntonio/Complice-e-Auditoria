import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CreateUserUseCase } from "../../../application/use-cases/create-user.use-case";
import { GetUserByIdUseCase } from "../../../application/use-cases/get-user-by-id.use-case";
import type { CreateUserDto } from "../../../application/dtos/create-user.dto";
import type { AuthenticatedRequest } from "@lframework/shared";
import { logger, sendError } from "@lframework/shared";
import type { IOutboxRepository } from "../../../application/ports/outbox-repository.port";
import {
  createSecurityAuditEvent,
  SECURITY_AUDIT_EVENTS,
} from "../../../application/security-audit";
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
    private readonly outboxRepository: IOutboxRepository
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (authReq.userRole !== USER_ROLES.ADMINISTRADOR) {
        try {
          await this.outboxRepository.append(
            createSecurityAuditEvent(SECURITY_AUDIT_EVENTS.ACCESS_DENIED, {
              actorUserId: authReq.userId,
              actorRole: authReq.userRole,
              resource: "POST /api/users",
              requiredRole: USER_ROLES.ADMINISTRADOR,
              ipAddress: req.ip,
            })
          );
        } catch (err) {
          logger.error(
            { err, actorUserId: authReq.userId, resource: "POST /api/users" },
            "Failed to append access denied audit event"
          );
        }
        sendError(res, 403, "Forbidden");
        return;
      }
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
      const { id } = authReq.params;
      const parsed = uuidParamSchema.safeParse(id);
      if (!parsed.success) {
        sendError(res, 400, "Invalid user id format");
        return;
      }
      const userId = parsed.data;
      if (authReq.userId !== userId && authReq.userRole !== USER_ROLES.ADMINISTRADOR) {
        try {
          await this.outboxRepository.append(
            createSecurityAuditEvent(SECURITY_AUDIT_EVENTS.ACCESS_DENIED, {
              actorUserId: authReq.userId,
              actorRole: authReq.userRole,
              resource: "GET /api/users/:id",
              targetUserId: userId,
              requiredRole: USER_ROLES.ADMINISTRADOR,
              ipAddress: req.ip,
            })
          );
        } catch (err) {
          logger.error(
            { err, actorUserId: authReq.userId, resource: "GET /api/users/:id" },
            "Failed to append access denied audit event"
          );
        }
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
}

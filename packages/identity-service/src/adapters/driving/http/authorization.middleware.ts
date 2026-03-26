import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  hasPermission,
  logger,
  sendError,
  type AuthenticatedRequest,
} from "@lframework/shared";
import type { IOutboxRepository } from "../../../application/ports/outbox-repository.port";
import {
  createSecurityAuditEvent,
  SECURITY_AUDIT_EVENTS,
} from "../../../application/security-audit";

const uuidSchema = z.string().uuid();

async function appendDeniedAuditSafely(
  outboxRepository: IOutboxRepository,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await outboxRepository.append(
      createSecurityAuditEvent(SECURITY_AUDIT_EVENTS.ACCESS_DENIED, payload)
    );
  } catch (err) {
    logger.error({ err, payload }, "Failed to append access denied audit event");
  }
}

export function requirePermissionWithAudit(
  outboxRepository: IOutboxRepository,
  permission: string,
  resource: string
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.userId) {
      sendError(res, 401, "Unauthorized");
      return;
    }

    if (hasPermission(req, permission)) {
      next();
      return;
    }

    await appendDeniedAuditSafely(outboxRepository, {
      actorUserId: authReq.userId,
      actorRole: authReq.userPrimaryRole,
      actorPermissions: authReq.userPermissions,
      resource,
      requiredPermission: permission,
      ipAddress: req.ip,
    });
    sendError(res, 403, "Forbidden");
  };
}

export function requireSelfOrPermissionWithAudit(
  outboxRepository: IOutboxRepository,
  selfPermission: string,
  anyPermission: string,
  resource: string,
  paramName = "id"
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const targetUserId = req.params[paramName];
    if (!authReq.userId) {
      sendError(res, 401, "Unauthenticated request");
      return;
    }

    if (!targetUserId) {
      sendError(res, 400, "Missing or invalid target user id");
      return;
    }

    if (!uuidSchema.safeParse(targetUserId).success) {
      sendError(res, 400, "Missing or invalid target user id");
      return;
    }

    const canReadAny = hasPermission(req, anyPermission);
    const isSelfAccess = authReq.userId === targetUserId;
    const canReadSelf = isSelfAccess && hasPermission(req, selfPermission);
    if (canReadAny || canReadSelf) {
      next();
      return;
    }

    await appendDeniedAuditSafely(outboxRepository, {
      actorUserId: authReq.userId,
      actorRole: authReq.userPrimaryRole,
      actorPermissions: authReq.userPermissions,
      resource,
      targetUserId,
      requiredPermission: isSelfAccess ? selfPermission : anyPermission,
      allowedPermissions: [selfPermission, anyPermission],
      ipAddress: req.ip,
    });
    sendError(res, 403, "Forbidden");
  };
}

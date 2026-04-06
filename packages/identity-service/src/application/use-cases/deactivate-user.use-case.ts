import type { IUserRepository } from "../ports/user-repository.port";
import type { UserResponseDto } from "../dtos/user-response.dto";
import {
  createSecurityAuditEvent,
  type SecurityAuditContext,
  SECURITY_AUDIT_EVENTS,
} from "../security-audit";
import { toUserResponseDto } from "../dtos/user-profile.mapper";
import { AuthorizationError } from "../errors";
import { PERMISSIONS } from "../../domain/types";

export class DeactivateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    userId: string,
    actorUserId: string,
    auditContext: SecurityAuditContext = {}
  ): Promise<UserResponseDto | null> {
    const actor = await this.userRepository.findById(actorUserId);
    const canDeactivate = actor?.permissions.includes(PERMISSIONS.USERS_DEACTIVATE) ?? false;
    if (!canDeactivate) {
      throw new AuthorizationError("Forbidden");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    const wasActive = user.isActive;
    const previousBlockedUntil = user.blockedUntil?.toISOString() ?? null;
    user.setActive(false);
    user.setBlockedUntil(null);

    await this.userRepository.saveUserAndOutbox(
      user,
      createSecurityAuditEvent(SECURITY_AUDIT_EVENTS.USER_DEACTIVATED, {
        actorUserId,
        targetUserId: user.id,
        wasActive,
        previousBlockedUntil,
        authzVersion: user.authorizationVersion,
        ipAddress: auditContext.ipAddress,
        requestId: auditContext.requestId,
        correlationId: auditContext.correlationId ?? auditContext.requestId,
        userAgent: auditContext.userAgent,
      })
    );

    return toUserResponseDto(user);
  }
}

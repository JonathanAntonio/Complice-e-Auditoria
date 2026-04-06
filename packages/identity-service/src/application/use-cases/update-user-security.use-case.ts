import type { IUserRepository } from "../ports/user-repository.port";
import type { UpdateUserSecurityDto } from "../dtos/update-user-security.dto";
import type { UserResponseDto } from "../dtos/user-response.dto";
import { createSecurityAuditEvent, type SecurityAuditContext, SECURITY_AUDIT_EVENTS } from "../security-audit";
import { toUserResponseDto } from "../dtos/user-profile.mapper";
import { AuthorizationError } from "../errors";
import { PERMISSIONS } from "../../domain/types";

export class UpdateUserSecurityUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    userId: string,
    dto: UpdateUserSecurityDto,
    actorUserId: string,
    auditContext: SecurityAuditContext = {}
  ): Promise<UserResponseDto | null> {
    const actor = await this.userRepository.findById(actorUserId);
    const canUpdate = actor?.permissions.includes(PERMISSIONS.USERS_UPDATE) ?? false;
    if (!canUpdate) {
      throw new AuthorizationError("Forbidden");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    const previous = {
      isActive: user.isActive,
      blockedUntil: user.blockedUntil?.toISOString() ?? null,
      failedLoginAttempts: user.failedLoginAttempts,
    };

    if (dto.isActive !== undefined) {
      user.setActive(dto.isActive);
    }

    if (dto.blockedUntil !== undefined) {
      user.setBlockedUntil(dto.blockedUntil);
    }

    const next = {
      isActive: user.isActive,
      blockedUntil: user.blockedUntil?.toISOString() ?? null,
      failedLoginAttempts: user.failedLoginAttempts,
    };

    await this.userRepository.saveUserAndOutbox(
      user,
      createSecurityAuditEvent(SECURITY_AUDIT_EVENTS.USER_SECURITY_CHANGED, {
        actorUserId,
        targetUserId: user.id,
        previous,
        next,
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

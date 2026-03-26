import type { IUserRepository } from "../ports/user-repository.port";
import type { AssignUserRolesDto } from "../dtos/assign-user-role.dto";
import type { UserResponseDto } from "../dtos/user-response.dto";
import { createSecurityAuditEvent, SECURITY_AUDIT_EVENTS } from "../security-audit";
import { toUserResponseDto } from "../dtos/user-profile.mapper";
import { AuthorizationError } from "../errors";
import { PERMISSIONS } from "../../domain/types";

export class AssignUserRolesUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /** Requires actorUserId to have roles.assign permission before mutating target user roles. */
  async execute(
    userId: string,
    dto: AssignUserRolesDto,
    actorUserId: string
  ): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    const actor = await this.userRepository.findById(actorUserId);
    const canAssignRoles = actor?.permissions.includes(PERMISSIONS.ROLES_ASSIGN) ?? false;
    if (!canAssignRoles) {
      throw new AuthorizationError("Forbidden");
    }

    const previousRole = user.primaryRole;
    const previousRoles = [...user.roles];
    user.assignRoles(dto.primaryRole, dto.roles);
    await this.userRepository.saveUserAndOutbox(
      user,
      createSecurityAuditEvent(SECURITY_AUDIT_EVENTS.ROLE_CHANGED, {
        actorUserId,
        targetUserId: user.id,
        previousRole,
        previousRoles,
        newRole: user.primaryRole,
        newRoles: user.roles,
        authzVersion: user.authorizationVersion,
      })
    );

    return toUserResponseDto(user);
  }
}

import type { IUserRepository } from "../ports/user-repository.port";
import type { AssignUserRoleDto } from "../dtos/assign-user-role.dto";
import type { UserResponseDto } from "../dtos/user-response.dto";
import { createSecurityAuditEvent } from "../security-audit";
import { toUserResponseDto } from "../dtos/user-profile.mapper";

export class AssignUserRoleUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    userId: string,
    dto: AssignUserRoleDto,
    actorUserId: string
  ): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    const previousRole = user.primaryRole;
    user.assignRole(dto.primaryRole);
    await this.userRepository.saveUserAndOutbox(
      user,
      createSecurityAuditEvent("identity.auth.role_changed", {
        actorUserId,
        targetUserId: user.id,
        previousRole,
        newRole: user.primaryRole,
        authzVersion: user.authorizationVersion,
      })
    );

    return toUserResponseDto(user);
  }
}

import type { AuthUserDto } from "./auth-response.dto";
import type { UserResponseDto } from "./user-response.dto";
import type { User } from "../../domain/entities/user.entity";

export function toAuthUserDto(user: User, overrides: Partial<AuthUserDto> = {}): AuthUserDto {
  return {
    id: user.id,
    email: user.email.value,
    name: user.name,
    primaryRole: user.primaryRole,
    permissions: user.permissions,
    authzVersion: user.authorizationVersion,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    ...overrides,
  };
}

export function toUserResponseDto(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email.value,
    name: user.name,
    primaryRole: user.primaryRole,
    permissions: user.permissions,
    authzVersion: user.authorizationVersion,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

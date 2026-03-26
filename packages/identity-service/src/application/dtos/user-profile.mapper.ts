import type { AuthUserDto } from "./auth-response.dto";
import type { UserResponseDto } from "./user-response.dto";
import type { User } from "../../domain/entities/user.entity";

export interface AuthUserDtoOptions {
  name?: string;
  isNewUser?: boolean;
}

export function toAuthUserDto(user: User, options: AuthUserDtoOptions = {}): AuthUserDto {
  return {
    id: user.id,
    email: user.email.value,
    name: options.name ?? user.name,
    primaryRole: user.primaryRole,
    roles: user.roles,
    permissions: user.permissions,
    authzVersion: user.authorizationVersion,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    isNewUser: options.isNewUser,
  };
}

export function toUserResponseDto(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email.value,
    name: user.name,
    primaryRole: user.primaryRole,
    roles: user.roles,
    permissions: user.permissions,
    authzVersion: user.authorizationVersion,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

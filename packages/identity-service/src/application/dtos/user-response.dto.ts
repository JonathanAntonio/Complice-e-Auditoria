import { z } from "zod";
import {
  PERMISSION_VALUES,
  USER_ROLE_VALUES,
  type Permission,
  type UserRole,
} from "../../domain/types";

const userRoleValues = USER_ROLE_VALUES as [UserRole, ...UserRole[]];
const userRoleSchema = z.enum(userRoleValues);
const permissionValues = PERMISSION_VALUES as [Permission, ...Permission[]];
const permissionSchema = z.enum(permissionValues);

export const userResponseDtoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  primaryRole: userRoleSchema,
  roles: z.array(userRoleSchema).min(1),
  permissions: z.array(permissionSchema),
  authzVersion: z.number().int().positive(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export type UserResponseDto = z.infer<typeof userResponseDtoSchema>;

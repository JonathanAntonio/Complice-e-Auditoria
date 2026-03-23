import { z } from "zod";
import { USER_ROLE_VALUES, type UserRole } from "../../domain/types";

const userRoleValues = USER_ROLE_VALUES as [UserRole, ...UserRole[]];

export const assignUserRoleSchema = z
  .object({
    primaryRole: z.enum(userRoleValues),
  })
  .strict();

export type AssignUserRoleDto = z.infer<typeof assignUserRoleSchema>;

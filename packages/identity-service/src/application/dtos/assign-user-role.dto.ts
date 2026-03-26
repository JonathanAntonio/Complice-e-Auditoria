import { z } from "zod";
import { USER_ROLE_VALUES, type UserRole } from "../../domain/types";

const userRoleValues = USER_ROLE_VALUES as [UserRole, ...UserRole[]];

export const assignUserRolesSchema = z
  .object({
    primaryRole: z.enum(userRoleValues),
    roles: z.array(z.enum(userRoleValues)).min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    const uniqueRoles = new Set(value.roles);
    if (uniqueRoles.size !== value.roles.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["roles"],
        message: "Roles must not contain duplicates",
      });
    }

    if (!value.roles.includes(value.primaryRole)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["primaryRole"],
        message: "Primary role must be included in roles",
      });
    }
  });

export const assignUserRoleSchema = z
  .object({
    primaryRole: z.enum(userRoleValues),
  })
  .strict();

export type AssignUserRolesDto = z.infer<typeof assignUserRolesSchema>;
export type AssignUserRoleDto = z.infer<typeof assignUserRoleSchema>;

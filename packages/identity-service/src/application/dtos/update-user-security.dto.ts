import { z } from "zod";

export const updateUserSecuritySchema = z
  .object({
    isActive: z.boolean().optional(),
    blockedUntil: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .strict()
  .refine(
    (value) => value.isActive !== undefined || value.blockedUntil !== undefined,
    "At least one field must be provided"
  );

export type UpdateUserSecurityRequestDto = z.infer<typeof updateUserSecuritySchema>;

export interface UpdateUserSecurityDto {
  isActive?: boolean;
  blockedUntil?: Date | null;
}

export function toUpdateUserSecurityDto(
  value: UpdateUserSecurityRequestDto
): UpdateUserSecurityDto {
  return {
    isActive: value.isActive,
    blockedUntil:
      value.blockedUntil === undefined
        ? undefined
        : value.blockedUntil === null
          ? null
          : new Date(value.blockedUntil),
  };
}

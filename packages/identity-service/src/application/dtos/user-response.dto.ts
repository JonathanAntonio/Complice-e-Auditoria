import { z } from "zod";
import { USER_ROLE_VALUES, type UserRole } from "../../domain/types";

const userRoleValues = USER_ROLE_VALUES as [UserRole, ...UserRole[]];
const userRoleSchema = z.enum(userRoleValues);

export const userResponseDtoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: userRoleSchema,
  isActive: z.boolean(),
  createdAt: z.string(),
});

export type UserResponseDto = z.infer<typeof userResponseDtoSchema>;

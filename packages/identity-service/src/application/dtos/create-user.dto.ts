import { z } from "zod";
import { emailSchema, nameSchema } from "./user-common.schema";

/**
 * Schema de validação para criação de usuário (administrador).
 * Fonte única de verdade: tipo e runtime validation.
 */
export const createUserSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: z.string().min(6).optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

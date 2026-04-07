import { z } from "zod";
import { nameSchema as sharedNameSchema, MAX_NAME_LENGTH as sharedMaxNameLength } from "@lframework/shared";

/**
 * Regras compartilhadas de validação para dados básicos de usuário.
 */
export const MAX_EMAIL_LENGTH = 254;

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email format")
  .max(MAX_EMAIL_LENGTH, `Email must have at most ${MAX_EMAIL_LENGTH} characters`)
  .transform((value) => value.toLowerCase());

export const MAX_NAME_LENGTH = sharedMaxNameLength;
export const nameSchema = sharedNameSchema;

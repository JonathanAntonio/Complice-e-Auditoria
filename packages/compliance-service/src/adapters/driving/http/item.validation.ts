import { createValidateBody } from "@lframework/shared";
import { z } from "zod";

const createViolationSchema = z.object({
  title: z.string().trim().min(3).max(120),
  severity: z.enum(["baixa", "media", "alta"]).optional().default("media"),
});

export const validateCreateItem = createValidateBody(createViolationSchema);
export const validateUpdateItem = createValidateBody(createViolationSchema);

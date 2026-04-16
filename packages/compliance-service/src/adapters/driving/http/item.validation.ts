import { createValidateBody } from "@lframework/shared";
import { z } from "zod";

const createViolationSchema = z.object({
  title: z.string().trim().min(3).max(120),
  severity: z.enum(["baixa", "media", "alta"]).optional().default("media"),
});
const updateViolationSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  severity: z.enum(["baixa", "media", "alta"]).optional(),
  status: z.enum(["aberta", "em_analise", "resolvida", "dispensada"]).optional(),
}).refine(
  (value) => value.title !== undefined || value.severity !== undefined || value.status !== undefined,
  "At least one field is required"
);

export const validateCreateItem = createValidateBody(createViolationSchema);
export const validateUpdateItem = createValidateBody(updateViolationSchema);

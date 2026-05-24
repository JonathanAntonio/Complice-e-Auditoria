import { createValidateBody } from "@lframework/shared";
import { z } from "zod";

const createViolationSchema = z.object({
  title: z.string().trim().min(3).max(120),
  severity: z.enum(["baixa", "media", "alta", "critica"]).optional().default("media"),
});
const updateViolationSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  severity: z.enum(["baixa", "media", "alta", "critica"]).optional(),
  status: z.enum(["aberta", "em_analise", "resolvida", "dispensada"]).optional(),
  dismissalJustification: z.string().trim().min(5).max(500).optional(),
  dismissalApprovedBy: z.string().trim().min(3).max(120).optional(),
}).refine(
  (value) =>
    value.title !== undefined ||
    value.severity !== undefined ||
    value.status !== undefined ||
    value.dismissalJustification !== undefined ||
    value.dismissalApprovedBy !== undefined,
  "At least one field is required"
).refine(
  (value) => value.status !== "dispensada" || Boolean(value.dismissalJustification),
  "dismissalJustification is required when status is dispensada"
);

export const validateCreateItem = createValidateBody(createViolationSchema);
export const validateUpdateItem = createValidateBody(updateViolationSchema);

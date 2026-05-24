import { z } from "zod";
import { createItemSchema } from "./create-item.dto";

export const updateItemSchema = createItemSchema.partial().extend({
  status: z.enum(["aberta", "em_analise", "resolvida", "dispensada"]).optional(),
  dismissalJustification: z.string().trim().min(5).max(500).optional(),
  dismissalApprovedBy: z.string().trim().min(3).max(120).optional(),
}).refine(
  (value) =>
    value.name !== undefined ||
    value.priceAmount !== undefined ||
    value.priceCurrency !== undefined ||
    value.status !== undefined ||
    value.dismissalJustification !== undefined ||
    value.dismissalApprovedBy !== undefined,
  "At least one field must be provided"
).refine(
  (value) => value.status !== "dispensada" || Boolean(value.dismissalJustification),
  "dismissalJustification is required when status is dispensada"
);

export type UpdateItemDto = z.infer<typeof updateItemSchema>;

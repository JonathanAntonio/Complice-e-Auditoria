import { z } from "zod";
import { createItemSchema } from "./create-item.dto";

export const updateItemSchema = createItemSchema.partial().extend({
  status: z.enum(["aberta", "em_analise", "resolvida", "dispensada"]).optional(),
}).refine(
  (value) => value.name !== undefined || value.priceAmount !== undefined || value.priceCurrency !== undefined || value.status !== undefined,
  "At least one field must be provided"
);

export type UpdateItemDto = z.infer<typeof updateItemSchema>;

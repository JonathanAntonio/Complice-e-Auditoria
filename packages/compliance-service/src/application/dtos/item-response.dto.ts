import { z } from "zod";

export const itemResponseDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceAmount: z.number(),
  priceCurrency: z.string(),
  status: z.enum(["aberta", "em_analise", "resolvida", "dispensada"]),
  resolvedAt: z.string().nullable(),
  dismissedAt: z.string().nullable(),
  retentionUntil: z.string().nullable(),
  createdAt: z.string(),
});

export type ItemResponseDto = z.infer<typeof itemResponseDtoSchema>;

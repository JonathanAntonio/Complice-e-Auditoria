import { z } from "zod";

export const itemResponseDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceAmount: z.number(),
  priceCurrency: z.string(),
  status: z.enum(["aberta", "em_analise", "resolvida", "dispensada"]),
  resolvedAt: z.string().datetime().nullable(),
  dismissedAt: z.string().datetime().nullable(),
  retentionUntil: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type ItemResponseDto = z.infer<typeof itemResponseDtoSchema>;

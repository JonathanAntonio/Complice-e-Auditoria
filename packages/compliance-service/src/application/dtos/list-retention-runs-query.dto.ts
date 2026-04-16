import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["running", "success", "failed"]).optional(),
});

export type ListRetentionRunsQueryDto = z.infer<typeof querySchema>;

export function parseListRetentionRunsQueryDto(input: unknown): ListRetentionRunsQueryDto {
  return querySchema.parse(input);
}

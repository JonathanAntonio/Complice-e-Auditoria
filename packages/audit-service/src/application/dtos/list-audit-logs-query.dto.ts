import { z } from "zod";

const severityValues = ["low", "medium", "high", "critical"] as const;

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: z.string().trim().min(1).max(120).optional(),
  actorId: z.string().trim().min(1).max(120).optional(),
  severity: z.enum(severityValues).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
}).refine((value) => {
  if (!value.from || !value.to) return true;
  return Date.parse(value.from) <= Date.parse(value.to);
}, {
  message: "from must be before or equal to to",
  path: ["from"],
});

export type ListAuditLogsQueryDto = z.infer<typeof querySchema>;

export function parseListAuditLogsQueryDto(input: unknown): ListAuditLogsQueryDto {
  return querySchema.parse(input);
}

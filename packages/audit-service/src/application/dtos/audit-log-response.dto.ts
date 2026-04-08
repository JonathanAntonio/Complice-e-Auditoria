import { z } from "zod";

export const auditLogItemResponseSchema = z.object({
  eventId: z.string(),
  eventType: z.string(),
  occurredAtUTC: z.string().datetime(),
  recordedAtUTC: z.string().datetime(),
  actorId: z.string().nullable(),
  actorType: z.string().nullable(),
  sourceService: z.string(),
  correlationId: z.string(),
  severity: z.string(),
  payload: z.record(z.unknown()),
});

export const auditLogListResponseSchema = z.object({
  items: z.array(auditLogItemResponseSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

export type AuditLogItemResponseDto = z.infer<typeof auditLogItemResponseSchema>;
export type AuditLogListResponseDto = z.infer<typeof auditLogListResponseSchema>;

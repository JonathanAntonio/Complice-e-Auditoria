import type { EventEnvelopeV1 } from "@lframework/shared";
import type { IAuditLogRepository } from "../../../application/ports/audit-log-repository.port";
import type { AuditLogListResponseDto } from "../../../application/dtos/audit-log-response.dto";
import type { ListAuditLogsQueryDto } from "../../../application/dtos/list-audit-logs-query.dto";
import type { ListRetentionRunsQueryDto } from "../../../application/dtos/list-retention-runs-query.dto";
import type { RetentionRunListResponseDto } from "../../../application/dtos/retention-run-response.dto";
import { PrismaClient } from "../../../../generated/prisma-client";

function toSeverity(payload: Record<string, unknown>): string {
  const raw = typeof payload.severity === "string" ? payload.severity.toLowerCase().trim() : "";
  if (raw === "critical" || raw === "high" || raw === "medium" || raw === "low") {
    return raw;
  }
  if (raw === "alta") return "high";
  if (raw === "media" || raw === "média") return "medium";
  if (raw === "baixa") return "low";
  return "medium";
}

function toActorId(payload: Record<string, unknown>): string | null {
  const actorId = payload.actorId;
  if (typeof actorId === "string" && actorId.trim().length > 0) return actorId.trim();

  const userId = payload.userId;
  if (typeof userId === "string" && userId.trim().length > 0) return userId.trim();

  return null;
}

function toActorType(payload: Record<string, unknown>): string | null {
  const actorType = payload.actorType;
  if (typeof actorType === "string" && actorType.trim().length > 0) return actorType.trim();

  if (toActorId(payload)) return "user";
  return null;
}

export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveFromEnvelope(envelope: EventEnvelopeV1): Promise<void> {
    const payload = envelope.payload as Record<string, unknown>;

    // Upsert equivalent using create with conflict check (standard Prisma way or use catch)
    // Here we use upsert with empty update to achieve DO NOTHING behavior
    await this.prisma.auditLogModel.upsert({
      where: { eventId: envelope.eventId },
      update: {}, 
      create: {
        eventId: envelope.eventId,
        eventType: envelope.type,
        occurredAtUTC: new Date(envelope.occurredAtUTC),
        actorId: toActorId(payload),
        actorType: toActorType(payload),
        sourceService: envelope.producer,
        correlationId: envelope.correlationId,
        severity: toSeverity(payload),
        payload: payload as any,
      },
    });
  }

  async list(query: ListAuditLogsQueryDto): Promise<AuditLogListResponseDto> {
    const where: any = {};

    if (query.type) where.eventType = query.type;
    if (query.actorId) where.actorId = query.actorId;
    if (query.severity) where.severity = query.severity;
    
    if (query.from || query.to) {
      where.occurredAtUTC = {};
      if (query.from) where.occurredAtUTC.gte = new Date(query.from);
      if (query.to) where.occurredAtUTC.lte = new Date(query.to);
    }

    const [total, rows] = await Promise.all([
      this.prisma.auditLogModel.count({ where }),
      this.prisma.auditLogModel.findMany({
        where,
        orderBy: { occurredAtUTC: "desc" },
        take: query.pageSize,
        skip: (query.page - 1) * query.pageSize,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        eventId: row.eventId,
        eventType: row.eventType,
        occurredAtUTC: row.occurredAtUTC.toISOString(),
        recordedAtUTC: row.recordedAtUTC.toISOString(),
        actorId: row.actorId,
        actorType: row.actorType,
        sourceService: row.sourceService,
        correlationId: row.correlationId,
        severity: row.severity,
        payload: row.payload as Record<string, unknown>,
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async listRetentionRuns(query: ListRetentionRunsQueryDto): Promise<RetentionRunListResponseDto> {
    const where: any = {};

    if (query.status) where.status = query.status;

    const [total, rows] = await Promise.all([
      this.prisma.auditRetentionRunModel.count({ where }),
      this.prisma.auditRetentionRunModel.findMany({
        where,
        orderBy: { startedAt: "desc" },
        take: query.pageSize,
        skip: (query.page - 1) * query.pageSize,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        startedAt: row.startedAt.toISOString(),
        finishedAt: row.finishedAt?.toISOString() ?? null,
        status: row.status as any,
        retentionDays: row.retentionDays,
        cutoffAt: row.cutoffAt.toISOString(),
        scannedCount: row.scannedCount,
        eligibleCount: row.eligibleCount,
        monitorOnlyCount: row.monitorOnlyCount,
        errorMessage: row.errorMessage,
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }
}

import type { EventEnvelopeV1 } from "@lframework/shared";
import type { IAuditLogRepository } from "../../../application/ports/audit-log-repository.port";
import type { AuditLogListResponseDto } from "../../../application/dtos/audit-log-response.dto";
import type { ListAuditLogsQueryDto } from "../../../application/dtos/list-audit-logs-query.dto";
import type { ListRetentionRunsQueryDto } from "../../../application/dtos/list-retention-runs-query.dto";
import type { RetentionRunListResponseDto } from "../../../application/dtos/retention-run-response.dto";

interface AuditDb {
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
  $queryRawUnsafe<T>(query: string, ...values: unknown[]): Promise<T>;
}

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
  constructor(private readonly prisma: AuditDb) {}

  async saveFromEnvelope(envelope: EventEnvelopeV1): Promise<void> {
    const payload = envelope.payload as Record<string, unknown>;

    await this.prisma.$executeRawUnsafe(
      `
        INSERT INTO "audit_logs" (
          "id",
          "event_id",
          "event_type",
          "occurred_at_utc",
          "recorded_at_utc",
          "actor_id",
          "actor_type",
          "source_service",
          "correlation_id",
          "severity",
          "payload"
        ) VALUES (
          $1,
          $1,
          $2,
          $3::timestamptz,
          NOW(),
          $4,
          $5,
          $6,
          $7,
          $8,
          $9::jsonb
        )
        ON CONFLICT ("event_id") DO NOTHING
      `,
      envelope.eventId,
      envelope.type,
      envelope.occurredAtUTC,
      toActorId(payload),
      toActorType(payload),
      envelope.producer,
      envelope.correlationId,
      toSeverity(payload),
      JSON.stringify(payload)
    );
  }

  async list(query: ListAuditLogsQueryDto): Promise<AuditLogListResponseDto> {
    const whereParts: string[] = [];
    const values: unknown[] = [];

    if (query.type) {
      values.push(query.type);
      whereParts.push(`"event_type" = $${values.length}`);
    }
    if (query.actorId) {
      values.push(query.actorId);
      whereParts.push(`"actor_id" = $${values.length}`);
    }
    if (query.severity) {
      values.push(query.severity);
      whereParts.push(`"severity" = $${values.length}`);
    }
    if (query.from) {
      values.push(query.from);
      whereParts.push(`"occurred_at_utc" >= $${values.length}::timestamptz`);
    }
    if (query.to) {
      values.push(query.to);
      whereParts.push(`"occurred_at_utc" <= $${values.length}::timestamptz`);
    }

    const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
    const offset = (query.page - 1) * query.pageSize;

    const countRows = await this.prisma.$queryRawUnsafe<Array<{ total: number }>>(
      `SELECT COUNT(*)::int AS total FROM "audit_logs" ${whereSql}`,
      ...values
    );
    const total = countRows[0]?.total ?? 0;

    values.push(query.pageSize);
    const takeIndex = values.length;
    values.push(offset);
    const skipIndex = values.length;

    const rows = await this.prisma.$queryRawUnsafe<
      Array<{
        eventId: string;
        eventType: string;
        occurredAtUTC: Date;
        recordedAtUTC: Date;
        actorId: string | null;
        actorType: string | null;
        sourceService: string;
        correlationId: string;
        severity: string;
        payload: Record<string, unknown>;
      }>
    >(
      `
        SELECT
          "event_id" AS "eventId",
          "event_type" AS "eventType",
          "occurred_at_utc" AS "occurredAtUTC",
          "recorded_at_utc" AS "recordedAtUTC",
          "actor_id" AS "actorId",
          "actor_type" AS "actorType",
          "source_service" AS "sourceService",
          "correlation_id" AS "correlationId",
          "severity",
          "payload"
        FROM "audit_logs"
        ${whereSql}
        ORDER BY "occurred_at_utc" DESC
        LIMIT $${takeIndex}
        OFFSET $${skipIndex}
      `,
      ...values
    );

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
    const whereParts: string[] = [];
    const values: unknown[] = [];

    if (query.status) {
      values.push(query.status);
      whereParts.push(`"status" = $${values.length}`);
    }

    const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
    const offset = (query.page - 1) * query.pageSize;

    const countRows = await this.prisma.$queryRawUnsafe<Array<{ total: number }>>(
      `SELECT COUNT(*)::int AS total FROM "audit_retention_runs" ${whereSql}`,
      ...values
    );
    const total = countRows[0]?.total ?? 0;

    values.push(query.pageSize);
    const takeIndex = values.length;
    values.push(offset);
    const skipIndex = values.length;

    const rows = await this.prisma.$queryRawUnsafe<Array<{
      id: string;
      startedAt: Date;
      finishedAt: Date | null;
      status: "running" | "success" | "failed";
      retentionDays: number;
      cutoffAt: Date;
      scannedCount: number;
      eligibleCount: number;
      monitorOnlyCount: number;
      errorMessage: string | null;
    }>>(
      `
      SELECT
        "id"::text AS "id",
        "started_at" AS "startedAt",
        "finished_at" AS "finishedAt",
        "status",
        "retention_days" AS "retentionDays",
        "cutoff_at" AS "cutoffAt",
        "scanned_count" AS "scannedCount",
        "eligible_count" AS "eligibleCount",
        "monitor_only_count" AS "monitorOnlyCount",
        "error_message" AS "errorMessage"
      FROM "audit_retention_runs"
      ${whereSql}
      ORDER BY "started_at" DESC
      LIMIT $${takeIndex}
      OFFSET $${skipIndex}
      `,
      ...values
    );

    return {
      items: rows.map((row) => ({
        id: row.id,
        startedAt: row.startedAt.toISOString(),
        finishedAt: row.finishedAt?.toISOString() ?? null,
        status: row.status,
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

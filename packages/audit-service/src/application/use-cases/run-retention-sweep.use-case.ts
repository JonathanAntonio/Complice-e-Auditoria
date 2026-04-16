import { randomUUID } from "crypto";
import { logger } from "@lframework/shared";

interface AuditDb {
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
  $queryRawUnsafe<T>(query: string, ...values: unknown[]): Promise<T>;
}

interface CountRow {
  total: number;
}

export interface AuditRetentionSweepInput {
  retentionDays: number;
  batchSize: number;
  scopedSourceServices?: string[];
}

export interface AuditRetentionSweepResult {
  runId: string;
  retentionDays: number;
  cutoffAt: string;
  scannedCount: number;
  eligibleCount: number;
  monitorOnlyCount: number;
  scopedSourceServices: string[];
}

export class RunAuditRetentionSweepUseCase {
  constructor(private readonly db: AuditDb) {}

  async execute(input: AuditRetentionSweepInput): Promise<AuditRetentionSweepResult> {
    const retentionDays = Math.max(1825, Math.floor(input.retentionDays));
    const batchSize = Math.max(1, Math.min(5000, Math.floor(input.batchSize)));
    const scopedSourceServices = (input.scopedSourceServices ?? [])
      .map((service) => service.trim())
      .filter((service) => service.length > 0);
    const cutoffAt = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const runId = randomUUID();

    await this.db.$executeRawUnsafe(
      `
      CREATE TABLE IF NOT EXISTS "audit_retention_runs" (
        "id" UUID PRIMARY KEY,
        "started_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "finished_at" TIMESTAMP(3),
        "status" TEXT NOT NULL,
        "retention_days" INTEGER NOT NULL,
        "cutoff_at" TIMESTAMP(3) NOT NULL,
        "scanned_count" INTEGER NOT NULL DEFAULT 0,
        "eligible_count" INTEGER NOT NULL DEFAULT 0,
        "monitor_only_count" INTEGER NOT NULL DEFAULT 0,
        "error_message" TEXT
      )
      `
    );
    await this.db.$executeRawUnsafe(
      `
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" TEXT PRIMARY KEY,
        "event_id" TEXT NOT NULL UNIQUE,
        "event_type" TEXT NOT NULL,
        "occurred_at_utc" TIMESTAMP(3) NOT NULL,
        "recorded_at_utc" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "actor_id" TEXT,
        "actor_type" TEXT,
        "source_service" TEXT NOT NULL,
        "correlation_id" TEXT NOT NULL,
        "severity" TEXT NOT NULL,
        "payload" JSONB NOT NULL
      )
      `
    );

    await this.db.$executeRawUnsafe(
      `
      INSERT INTO "audit_retention_runs" (
        "id", "status", "retention_days", "cutoff_at", "started_at"
      ) VALUES ($1::uuid, $2, $3, $4::timestamptz, NOW())
      `,
      runId,
      "running",
      retentionDays,
      cutoffAt.toISOString()
    );

    try {
      const rows = scopedSourceServices.length > 0
        ? await this.db.$queryRawUnsafe<Array<CountRow>>(
          `
          SELECT COUNT(*)::int AS total
          FROM (
            SELECT "event_id"
            FROM "audit_logs"
            WHERE "occurred_at_utc" <= $1::timestamptz
              AND "source_service" = ANY($3::text[])
            ORDER BY "occurred_at_utc" ASC
            LIMIT $2
          ) q
          `,
          cutoffAt.toISOString(),
          batchSize,
          scopedSourceServices
        )
        : await this.db.$queryRawUnsafe<Array<CountRow>>(
          `
          SELECT COUNT(*)::int AS total
          FROM (
            SELECT "event_id"
            FROM "audit_logs"
            WHERE "occurred_at_utc" <= $1::timestamptz
            ORDER BY "occurred_at_utc" ASC
            LIMIT $2
          ) q
          `,
          cutoffAt.toISOString(),
          batchSize
        );
      const eligibleCount = rows[0]?.total ?? 0;

      await this.db.$executeRawUnsafe(
        `
        UPDATE "audit_retention_runs"
        SET
          "finished_at" = NOW(),
          "status" = $2,
          "scanned_count" = $3,
          "eligible_count" = $4,
          "monitor_only_count" = $5
        WHERE "id" = $1::uuid
        `,
        runId,
        "success",
        eligibleCount,
        eligibleCount,
        eligibleCount
      );

      const result = {
        runId,
        retentionDays,
        cutoffAt: cutoffAt.toISOString(),
        scannedCount: eligibleCount,
        eligibleCount,
        monitorOnlyCount: eligibleCount,
        scopedSourceServices,
      };
      logger.info({ result }, "Audit retention sweep completed");
      return result;
    } catch (err) {
      await this.db.$executeRawUnsafe(
        `
        UPDATE "audit_retention_runs"
        SET
          "finished_at" = NOW(),
          "status" = $2,
          "error_message" = $3
        WHERE "id" = $1::uuid
        `,
        runId,
        "failed",
        err instanceof Error ? err.message : String(err)
      );
      throw err;
    }
  }
}

import { randomUUID } from "crypto";
import { logger } from "@lframework/shared";

interface ComplianceDb {
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
  $queryRawUnsafe<T>(query: string, ...values: unknown[]): Promise<T>;
}

interface EligibleRow {
  id: string;
  resolvedAt: Date | null;
  dismissedAt: Date | null;
  retentionUntil: Date | null;
}

export interface RetentionSweepInput {
  retentionDays: number;
  batchSize: number;
  scopedStatuses?: Array<"resolvida" | "dispensada">;
}

export interface RetentionSweepResult {
  runId: string;
  retentionDays: number;
  cutoffAt: string;
  scannedCount: number;
  eligibleCount: number;
  monitorOnlyCount: number;
  scopedStatuses: Array<"resolvida" | "dispensada">;
}

export class RunRetentionSweepUseCase {
  constructor(private readonly prisma: ComplianceDb) {}

  async execute(input: RetentionSweepInput): Promise<RetentionSweepResult> {
    const retentionDays = Math.max(1825, Math.floor(input.retentionDays));
    const batchSize = Math.max(1, Math.min(500, Math.floor(input.batchSize)));
    const scopedStatuses = input.scopedStatuses?.length
      ? input.scopedStatuses
      : (["resolvida", "dispensada"] as Array<"resolvida" | "dispensada">);
    const cutoffAt = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const runId = randomUUID();

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "compliance_retention_runs" (
        "id", "status", "retention_days", "cutoff_at", "started_at"
      ) VALUES (
        $1, $2, $3, $4::timestamptz, NOW()
      )
      `,
      runId,
      "running",
      retentionDays,
      cutoffAt.toISOString()
    );

    try {
      const eligible = await this.prisma.$queryRawUnsafe<Array<EligibleRow>>(
        `
        SELECT
          i."id",
          i."resolved_at" AS "resolvedAt",
          i."dismissed_at" AS "dismissedAt",
          i."retention_until" AS "retentionUntil"
        FROM "items" i
        WHERE i."status" = ANY($3::"ViolationStatus"[])
          AND COALESCE(i."resolved_at", i."dismissed_at") IS NOT NULL
          AND COALESCE(i."resolved_at", i."dismissed_at") <= $1::timestamptz
        ORDER BY COALESCE(i."resolved_at", i."dismissed_at") ASC
        LIMIT $2
      `,
        cutoffAt.toISOString(),
        batchSize,
        scopedStatuses
      );

      for (const row of eligible) {
        const finalAt = row.resolvedAt ?? row.dismissedAt;
        if (!finalAt) {
          continue;
        }
        const desiredRetentionUntil = new Date(finalAt.getTime() + retentionDays * 24 * 60 * 60 * 1000);
        if (row.retentionUntil && row.retentionUntil.getTime() === desiredRetentionUntil.getTime()) {
          continue;
        }
        await this.prisma.$executeRawUnsafe(
          `
          UPDATE "items"
          SET "retention_until" = $2
          WHERE "id" = $1
          `,
          row.id,
          desiredRetentionUntil
        );
      }

      await this.prisma.$executeRawUnsafe(
        `
        UPDATE "compliance_retention_runs"
        SET
          "finished_at" = NOW(),
          "status" = $2,
          "scanned_count" = $3,
          "eligible_count" = $4,
          "monitor_only_count" = $5
        WHERE "id" = $1
      `,
        runId,
        "success",
        eligible.length,
        eligible.length,
        eligible.length
      );

      const result = {
        runId,
        retentionDays,
        cutoffAt: cutoffAt.toISOString(),
        scannedCount: eligible.length,
        eligibleCount: eligible.length,
        monitorOnlyCount: eligible.length,
        scopedStatuses,
      };
      logger.info({ result }, "Compliance retention sweep completed");
      return result;
    } catch (err) {
      await this.prisma.$executeRawUnsafe(
        `
        UPDATE "compliance_retention_runs"
        SET
          "finished_at" = NOW(),
          "status" = $2,
          "error_message" = $3
        WHERE "id" = $1
      `,
        runId,
        "failed",
        err instanceof Error ? err.message : String(err)
      );
      throw err;
    }
  }
}

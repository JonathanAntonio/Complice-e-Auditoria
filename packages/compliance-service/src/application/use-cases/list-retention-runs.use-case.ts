import type { ListRetentionRunsQueryDto } from "../dtos/list-retention-runs-query.dto";
import type { RetentionRunListResponseDto } from "../dtos/retention-run-response.dto";

interface ComplianceDb {
  $queryRawUnsafe<T>(query: string, ...values: unknown[]): Promise<T>;
}

export class ListRetentionRunsUseCase {
  constructor(private readonly db: ComplianceDb) {}

  async execute(query: ListRetentionRunsQueryDto): Promise<RetentionRunListResponseDto> {
    const whereParts: string[] = [];
    const values: unknown[] = [];
    if (query.status) {
      values.push(query.status);
      whereParts.push(`"status" = $${values.length}`);
    }

    const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
    const offset = (query.page - 1) * query.pageSize;

    const countRows = await this.db.$queryRawUnsafe<Array<{ total: number }>>(
      `SELECT COUNT(*)::int AS total FROM "compliance_retention_runs" ${whereSql}`,
      ...values
    );
    const total = countRows[0]?.total ?? 0;

    values.push(query.pageSize);
    const takeIndex = values.length;
    values.push(offset);
    const skipIndex = values.length;

    const rows = await this.db.$queryRawUnsafe<Array<{
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
      FROM "compliance_retention_runs"
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

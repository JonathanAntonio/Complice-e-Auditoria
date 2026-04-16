export interface RetentionRunItemDto {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "success" | "failed";
  retentionDays: number;
  cutoffAt: string;
  scannedCount: number;
  eligibleCount: number;
  monitorOnlyCount: number;
  errorMessage: string | null;
}

export interface RetentionRunListDto {
  items: RetentionRunItemDto[];
  page: number;
  pageSize: number;
  total: number;
}

export interface RetentionRunsQueryDto {
  page?: number;
  pageSize?: number;
  status?: "running" | "success" | "failed";
}

export function parseRetentionRunsQueryDto(input: unknown): RetentionRunsQueryDto {
  if (!input || typeof input !== "object") return {};
  const source = input as Record<string, unknown>;
  const page = toOptionalPositiveInt(source.page);
  const pageSize = toOptionalPositiveInt(source.pageSize);
  const status = toOptionalStatus(source.status);
  return {
    ...(page ? { page } : {}),
    ...(pageSize ? { pageSize } : {}),
    ...(status ? { status } : {}),
  };
}

export function parseRetentionRunListDto(payload: unknown): RetentionRunListDto {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid retention runs response");
  }
  const source = payload as {
    items?: unknown;
    page?: unknown;
    pageSize?: unknown;
    total?: unknown;
  };
  if (!Array.isArray(source.items)) {
    throw new Error("Invalid retention runs response");
  }
  if (!Number.isInteger(source.page) || !Number.isInteger(source.pageSize) || !Number.isInteger(source.total)) {
    throw new Error("Invalid retention runs response");
  }
  return {
    items: source.items.map(parseRetentionRunItemDto),
    page: Number(source.page),
    pageSize: Number(source.pageSize),
    total: Number(source.total),
  };
}

function parseRetentionRunItemDto(input: unknown): RetentionRunItemDto {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid retention run item");
  }
  const row = input as Record<string, unknown>;
  const status = typeof row.status === "string" ? row.status : "";
  if (status !== "running" && status !== "success" && status !== "failed") {
    throw new Error("Invalid retention run item");
  }
  if (
    typeof row.id !== "string" ||
    typeof row.startedAt !== "string" ||
    typeof row.retentionDays !== "number" ||
    typeof row.cutoffAt !== "string" ||
    typeof row.scannedCount !== "number" ||
    typeof row.eligibleCount !== "number" ||
    typeof row.monitorOnlyCount !== "number"
  ) {
    throw new Error("Invalid retention run item");
  }
  return {
    id: row.id,
    startedAt: row.startedAt,
    finishedAt: typeof row.finishedAt === "string" ? row.finishedAt : null,
    status,
    retentionDays: row.retentionDays,
    cutoffAt: row.cutoffAt,
    scannedCount: row.scannedCount,
    eligibleCount: row.eligibleCount,
    monitorOnlyCount: row.monitorOnlyCount,
    errorMessage: typeof row.errorMessage === "string" ? row.errorMessage : null,
  };
}

function toOptionalPositiveInt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

function toOptionalStatus(value: unknown): RetentionRunsQueryDto["status"] | undefined {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw === "running" || raw === "success" || raw === "failed") return raw;
  return undefined;
}

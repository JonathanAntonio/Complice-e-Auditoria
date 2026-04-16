const ALLOWED_STATUSES = new Set(["running", "success", "failed"]);

export function parseRetentionRunsResponseDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta inválida de execuções de retenção.");
  }

  const payload = raw;
  if (!Array.isArray(payload.items)) {
    throw new Error("Resposta inválida de execuções de retenção.");
  }

  return {
    items: payload.items.map(parseRetentionRunItemDto),
    page: Number.isInteger(payload.page) ? payload.page : 1,
    pageSize: Number.isInteger(payload.pageSize) ? payload.pageSize : payload.items.length,
    total: Number.isInteger(payload.total) ? payload.total : payload.items.length,
  };
}

export function parseRetentionRunsQueryDto(raw = {}) {
  if (!raw || typeof raw !== "object") return {};

  const query = raw;
  const page = Number.isInteger(query.page) && query.page > 0 ? query.page : undefined;
  const pageSize = Number.isInteger(query.pageSize) && query.pageSize > 0 ? query.pageSize : undefined;
  const status =
    typeof query.status === "string" && ALLOWED_STATUSES.has(query.status.toLowerCase())
      ? query.status.toLowerCase()
      : undefined;

  return {
    ...(page ? { page } : {}),
    ...(pageSize ? { pageSize } : {}),
    ...(status ? { status } : {}),
  };
}

function parseRetentionRunItemDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Execução de retenção inválida.");
  }

  const payload = raw;
  const status = typeof payload.status === "string" ? payload.status.toLowerCase() : "";
  if (
    typeof payload.id !== "string" ||
    typeof payload.startedAt !== "string" ||
    !ALLOWED_STATUSES.has(status) ||
    typeof payload.retentionDays !== "number" ||
    typeof payload.cutoffAt !== "string" ||
    typeof payload.scannedCount !== "number" ||
    typeof payload.eligibleCount !== "number" ||
    typeof payload.monitorOnlyCount !== "number"
  ) {
    throw new Error("Execução de retenção inválida.");
  }

  return {
    id: payload.id,
    startedAt: payload.startedAt,
    finishedAt: typeof payload.finishedAt === "string" ? payload.finishedAt : null,
    status,
    retentionDays: payload.retentionDays,
    cutoffAt: payload.cutoffAt,
    scannedCount: payload.scannedCount,
    eligibleCount: payload.eligibleCount,
    monitorOnlyCount: payload.monitorOnlyCount,
    errorMessage: typeof payload.errorMessage === "string" ? payload.errorMessage : null,
  };
}

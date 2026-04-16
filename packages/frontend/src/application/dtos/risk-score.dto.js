const ALLOWED_ENTITY_TYPES = new Set(["user", "area", "process"]);
const ALLOWED_LEVELS = new Set(["low", "medium", "high", "critical"]);

export function parseRiskScoresQueryDto(raw = {}) {
  if (!raw || typeof raw !== "object") return {};
  const source = raw;
  const output = {};

  const entityType = normalizeEntityType(source.entityType);
  if (entityType) output.entityType = entityType;
  const level = normalizeLevel(source.level);
  if (level) output.level = level;

  if (typeof source.search === "string" && source.search.trim().length > 0) {
    output.search = source.search.trim();
  }

  const minScore = toOptionalInt(source.minScore, 0, 100);
  if (minScore !== undefined) output.minScore = minScore;
  const maxScore = toOptionalInt(source.maxScore, 0, 100);
  if (maxScore !== undefined) output.maxScore = maxScore;
  const page = toOptionalInt(source.page, 1, Number.MAX_SAFE_INTEGER);
  if (page !== undefined) output.page = page;
  const pageSize = toOptionalInt(source.pageSize, 1, 100);
  if (pageSize !== undefined) output.pageSize = pageSize;

  if (source.sortBy === "score" || source.sortBy === "updatedAtUTC" || source.sortBy === "level") {
    output.sortBy = source.sortBy;
  }
  if (source.sortDir === "asc" || source.sortDir === "desc") {
    output.sortDir = source.sortDir;
  }

  return output;
}

export function parseRiskHistoryQueryDto(raw = {}) {
  if (!raw || typeof raw !== "object") return {};
  const source = raw;
  const output = {};
  if (typeof source.fromUTC === "string" && source.fromUTC.trim()) output.fromUTC = source.fromUTC.trim();
  if (typeof source.toUTC === "string" && source.toUTC.trim()) output.toUTC = source.toUTC.trim();
  if (source.bucket === "hour" || source.bucket === "day") output.bucket = source.bucket;
  return output;
}

export function parseRiskScoresResponseDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta inválida das pontuações de risco.");
  }

  const payload = raw;
  if (
    !Array.isArray(payload.items) ||
    !payload.summary ||
    typeof payload.total !== "number" ||
    typeof payload.page !== "number" ||
    typeof payload.pageSize !== "number"
  ) {
    throw new Error("Resposta inválida das pontuações de risco.");
  }

  return {
    items: payload.items.map((item) => parseRiskScoreItemDto(item)),
    summary: parseRiskSummaryDto(payload.summary),
    total: payload.total,
    page: payload.page,
    pageSize: payload.pageSize,
    generatedAtUTC: typeof payload.generatedAtUTC === "string" ? payload.generatedAtUTC : new Date().toISOString(),
  };
}

export function parseRiskScoreHistoryResponseDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta inválida do histórico de risco.");
  }
  const payload = raw;
  if (
    !ALLOWED_ENTITY_TYPES.has(String(payload.entityType ?? "")) ||
    typeof payload.entityId !== "string" ||
    typeof payload.fromUTC !== "string" ||
    typeof payload.toUTC !== "string" ||
    (payload.bucket !== "hour" && payload.bucket !== "day") ||
    !Array.isArray(payload.points) ||
    typeof payload.delta !== "number"
  ) {
    throw new Error("Resposta inválida do histórico de risco.");
  }

  return {
    entityType: payload.entityType,
    entityId: payload.entityId,
    fromUTC: payload.fromUTC,
    toUTC: payload.toUTC,
    bucket: payload.bucket,
    points: payload.points.map((point) => parseRiskHistoryPointDto(point)),
    delta: payload.delta,
  };
}

export function parseRiskEventInputDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Payload inválido para evento de risco.");
  }

  const payload = raw;
  const userId = typeof payload.userId === "string" ? payload.userId.trim() : "";
  const area = typeof payload.area === "string" ? payload.area.trim() : "";
  const processType = typeof payload.processType === "string" ? payload.processType.trim() : "";
  const severity = normalizeLevel(payload.severity) ?? "";

  if (!userId || !area || !processType) {
    throw new Error("Campos do evento de risco são obrigatórios.");
  }
  if (!ALLOWED_LEVELS.has(severity)) {
    throw new Error("Severidade inválida para evento de risco.");
  }

  return {
    userId,
    area,
    processType,
    severity,
  };
}

export function parseRiskEventIngestResultDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta inválida para ingestão de risco.");
  }

  const payload = raw;
  if (payload.accepted !== true || typeof payload.updatedAtUTC !== "string") {
    throw new Error("Resposta inválida para ingestão de risco.");
  }

  return {
    accepted: true,
    updatedAtUTC: payload.updatedAtUTC,
  };
}

function parseRiskSummaryDto(raw) {
  if (!raw || typeof raw !== "object") throw new Error("Resumo inválido de risco.");
  const payload = raw;
  const lowCount = toCount(payload.lowCount);
  const mediumCount = toCount(payload.mediumCount);
  const highCount = toCount(payload.highCount);
  const criticalCount = toCount(payload.criticalCount);
  if (lowCount === null || mediumCount === null || highCount === null || criticalCount === null) {
    throw new Error("Resumo inválido de risco.");
  }
  return { lowCount, mediumCount, highCount, criticalCount };
}

function parseRiskHistoryPointDto(raw) {
  if (!raw || typeof raw !== "object") throw new Error("Ponto de histórico inválido.");
  const payload = raw;
  if (typeof payload.bucketUTC !== "string" || typeof payload.score !== "number" || !ALLOWED_LEVELS.has(String(payload.level ?? ""))) {
    throw new Error("Ponto de histórico inválido.");
  }
  return {
    bucketUTC: payload.bucketUTC,
    score: payload.score,
    level: payload.level,
  };
}

function parseRiskScoreItemDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Item de risco inválido.");
  }

  const payload = raw;
  if (
    typeof payload.entityType !== "string" ||
    typeof payload.entityId !== "string" ||
    typeof payload.score !== "number" ||
    typeof payload.level !== "string" ||
    typeof payload.updatedAtUTC !== "string"
  ) {
    throw new Error("Item de risco inválido.");
  }

  const entityType = payload.entityType.toLowerCase();
  const level = payload.level.toLowerCase();

  if (!ALLOWED_ENTITY_TYPES.has(entityType) || !ALLOWED_LEVELS.has(level)) {
    throw new Error("Item de risco inválido.");
  }

  return {
    entityType,
    entityId: payload.entityId,
    score: Math.max(0, Math.min(100, Math.round(payload.score))),
    level,
    updatedAtUTC: payload.updatedAtUTC,
  };
}

function normalizeEntityType(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ALLOWED_ENTITY_TYPES.has(normalized) ? normalized : undefined;
}

function normalizeLevel(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ALLOWED_LEVELS.has(normalized) ? normalized : undefined;
}

function toOptionalInt(value, min, max) {
  const num = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : NaN;
  if (!Number.isInteger(num)) return undefined;
  if (num < min || num > max) return undefined;
  return num;
}

function toCount(value) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

export interface RiskScoreItemDto {
  entityType: "user" | "area" | "process";
  entityId: string;
  score: number;
  level: "low" | "medium" | "high" | "critical";
  updatedAtUTC: string;
}

export interface RiskScoresSummaryDto {
  lowCount: number;
  mediumCount: number;
  highCount: number;
  criticalCount: number;
}

export interface RiskScoresListDto {
  items: RiskScoreItemDto[];
  summary: RiskScoresSummaryDto;
  total: number;
  page: number;
  pageSize: number;
  generatedAtUTC: string;
}

export interface RiskScoresQueryDto {
  entityType?: "user" | "area" | "process";
  level?: "low" | "medium" | "high" | "critical";
  search?: string;
  minScore?: number;
  maxScore?: number;
  page?: number;
  pageSize?: number;
  sortBy?: "score" | "updatedAtUTC" | "level";
  sortDir?: "asc" | "desc";
}

export interface RiskScoreHistoryQueryDto {
  fromUTC?: string;
  toUTC?: string;
  bucket?: "hour" | "day";
}

export interface RiskScoreHistoryPointDto {
  bucketUTC: string;
  score: number;
  level: "low" | "medium" | "high" | "critical";
}

export interface RiskScoreHistoryDto {
  entityType: "user" | "area" | "process";
  entityId: string;
  fromUTC: string;
  toUTC: string;
  bucket: "hour" | "day";
  points: RiskScoreHistoryPointDto[];
  delta: number;
}

export interface RiskEventInputDto {
  userId: string;
  area: string;
  processType: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface RiskEventIngestResultDto {
  accepted: true;
  updatedAtUTC: string;
}

export function parseRiskScoresQueryDto(input: unknown): RiskScoresQueryDto {
  if (!input || typeof input !== "object") return {};
  const source = input as Record<string, unknown>;
  const parsed: RiskScoresQueryDto = {};

  const entityType = toEntityType(source.entityType);
  if (entityType) parsed.entityType = entityType;
  const level = toLevel(source.level);
  if (level) parsed.level = level;

  if (typeof source.search === "string" && source.search.trim().length > 0) {
    parsed.search = source.search.trim();
  }

  const minScore = toOptionalInt(source.minScore, 0, 100);
  if (minScore !== undefined) parsed.minScore = minScore;
  const maxScore = toOptionalInt(source.maxScore, 0, 100);
  if (maxScore !== undefined) parsed.maxScore = maxScore;
  const page = toOptionalInt(source.page, 1, Number.MAX_SAFE_INTEGER);
  if (page !== undefined) parsed.page = page;
  const pageSize = toOptionalInt(source.pageSize, 1, 100);
  if (pageSize !== undefined) parsed.pageSize = pageSize;

  if (source.sortBy === "score" || source.sortBy === "updatedAtUTC" || source.sortBy === "level") {
    parsed.sortBy = source.sortBy;
  }
  if (source.sortDir === "asc" || source.sortDir === "desc") {
    parsed.sortDir = source.sortDir;
  }

  return parsed;
}

export function parseRiskScoreHistoryQueryDto(raw: unknown): RiskScoreHistoryQueryDto {
  if (!raw || typeof raw !== "object") return {};
  const source = raw as Record<string, unknown>;
  const parsed: RiskScoreHistoryQueryDto = {};
  if (typeof source.fromUTC === "string" && source.fromUTC.trim()) parsed.fromUTC = source.fromUTC.trim();
  if (typeof source.toUTC === "string" && source.toUTC.trim()) parsed.toUTC = source.toUTC.trim();
  if (source.bucket === "hour" || source.bucket === "day") parsed.bucket = source.bucket;
  return parsed;
}

export function parseRiskEventInputDto(raw: unknown): RiskEventInputDto | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const userId = typeof source.userId === "string" ? source.userId.trim() : "";
  const area = typeof source.area === "string" ? source.area.trim() : "";
  const processType = typeof source.processType === "string" ? source.processType.trim() : "";
  const severity = toLevel(source.severity);

  if (!userId || !area || !processType || !severity) return null;
  return { userId, area, processType, severity };
}

export function parseRiskScoresListDto(raw: unknown): RiskScoresListDto {
  if (!raw || typeof raw !== "object") throw new Error("Invalid risk scores response");
  const payload = raw as {
    items?: unknown;
    summary?: unknown;
    total?: unknown;
    page?: unknown;
    pageSize?: unknown;
    generatedAtUTC?: unknown;
  };
  if (
    !Array.isArray(payload.items) ||
    !payload.summary ||
    typeof payload.total !== "number" ||
    typeof payload.page !== "number" ||
    typeof payload.pageSize !== "number" ||
    typeof payload.generatedAtUTC !== "string"
  ) {
    throw new Error("Invalid risk scores response");
  }

  return {
    items: payload.items.map((item) => parseRiskScoreItemDto(item)),
    summary: parseRiskSummaryDto(payload.summary),
    total: payload.total,
    page: payload.page,
    pageSize: payload.pageSize,
    generatedAtUTC: payload.generatedAtUTC,
  };
}

export function parseRiskScoreHistoryDto(raw: unknown): RiskScoreHistoryDto {
  if (!raw || typeof raw !== "object") throw new Error("Invalid risk history response");
  const payload = raw as Record<string, unknown>;
  if (
    !isEntityType(payload.entityType) ||
    typeof payload.entityId !== "string" ||
    typeof payload.fromUTC !== "string" ||
    typeof payload.toUTC !== "string" ||
    (payload.bucket !== "hour" && payload.bucket !== "day") ||
    !Array.isArray(payload.points) ||
    typeof payload.delta !== "number"
  ) {
    throw new Error("Invalid risk history response");
  }

  return {
    entityType: payload.entityType,
    entityId: payload.entityId,
    fromUTC: payload.fromUTC,
    toUTC: payload.toUTC,
    bucket: payload.bucket,
    points: payload.points.map((point) => parseRiskHistoryPoint(point)),
    delta: payload.delta,
  };
}

export function parseRiskEventIngestResultDto(raw: unknown): RiskEventIngestResultDto {
  if (!raw || typeof raw !== "object") throw new Error("Invalid risk ingest response");
  const payload = raw as { accepted?: unknown; updatedAtUTC?: unknown };
  if (payload.accepted !== true || typeof payload.updatedAtUTC !== "string") {
    throw new Error("Invalid risk ingest response");
  }
  return { accepted: true, updatedAtUTC: payload.updatedAtUTC };
}

function parseRiskSummaryDto(raw: unknown): RiskScoresSummaryDto {
  if (!raw || typeof raw !== "object") throw new Error("Invalid risk summary");
  const payload = raw as Record<string, unknown>;
  const lowCount = toCount(payload.lowCount);
  const mediumCount = toCount(payload.mediumCount);
  const highCount = toCount(payload.highCount);
  const criticalCount = toCount(payload.criticalCount);
  if (lowCount === null || mediumCount === null || highCount === null || criticalCount === null) {
    throw new Error("Invalid risk summary");
  }
  return { lowCount, mediumCount, highCount, criticalCount };
}

function parseRiskScoreItemDto(raw: unknown): RiskScoreItemDto {
  if (!raw || typeof raw !== "object") throw new Error("Invalid risk score item");
  const item = raw as Record<string, unknown>;
  if (
    !isEntityType(item.entityType) ||
    typeof item.entityId !== "string" ||
    typeof item.score !== "number" ||
    !isLevel(item.level) ||
    typeof item.updatedAtUTC !== "string"
  ) {
    throw new Error("Invalid risk score item");
  }

  return {
    entityType: item.entityType,
    entityId: item.entityId,
    score: item.score,
    level: item.level,
    updatedAtUTC: item.updatedAtUTC,
  };
}

function parseRiskHistoryPoint(raw: unknown): RiskScoreHistoryPointDto {
  if (!raw || typeof raw !== "object") throw new Error("Invalid risk history point");
  const point = raw as Record<string, unknown>;
  if (typeof point.bucketUTC !== "string" || typeof point.score !== "number" || !isLevel(point.level)) {
    throw new Error("Invalid risk history point");
  }
  return {
    bucketUTC: point.bucketUTC,
    score: point.score,
    level: point.level,
  };
}

function isEntityType(value: unknown): value is "user" | "area" | "process" {
  return value === "user" || value === "area" || value === "process";
}

function toEntityType(value: unknown): "user" | "area" | "process" | undefined {
  return isEntityType(value) ? value : undefined;
}

function isLevel(value: unknown): value is "low" | "medium" | "high" | "critical" {
  return value === "low" || value === "medium" || value === "high" || value === "critical";
}

function toLevel(value: unknown): "low" | "medium" | "high" | "critical" | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return isLevel(normalized) ? normalized : undefined;
}

function toOptionalInt(value: unknown, min: number, max: number): number | undefined {
  const num = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : NaN;
  if (!Number.isInteger(num)) return undefined;
  if (num < min || num > max) return undefined;
  return num;
}

function toCount(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

const ALLOWED_SEVERITIES = new Set(["low", "medium", "high", "critical"]);

export interface AuditLogItemDto {
  eventId: string;
  eventType: string;
  occurredAtUTC: string;
  recordedAtUTC: string;
  actorId: string | null;
  actorType: string | null;
  sourceService: string;
  correlationId: string;
  severity: "low" | "medium" | "high" | "critical";
  payload: Record<string, unknown>;
}

export interface AuditLogListDto {
  items: AuditLogItemDto[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AuditLogsQueryDto {
  page?: number;
  pageSize?: number;
  type?: string;
  actorId?: string;
  severity?: "low" | "medium" | "high" | "critical";
  from?: string;
  to?: string;
}

export function parseAuditLogListResponseDto(payload: unknown): AuditLogListDto {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid audit logs response");
  }

  const source = payload as {
    items?: unknown;
    page?: unknown;
    pageSize?: unknown;
    total?: unknown;
  };

  if (!Array.isArray(source.items)) {
    throw new Error("Invalid audit logs response");
  }

  if (!Number.isInteger(source.page) || !Number.isInteger(source.pageSize) || !Number.isInteger(source.total)) {
    throw new Error("Invalid audit logs response");
  }

  return {
    items: source.items.map(parseAuditLogItemDto),
    page: Number(source.page),
    pageSize: Number(source.pageSize),
    total: Number(source.total),
  };
}

function parseAuditLogItemDto(input: unknown): AuditLogItemDto {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid audit log item");
  }

  const row = input as Record<string, unknown>;
  const severity = typeof row.severity === "string" ? row.severity : "";
  if (!ALLOWED_SEVERITIES.has(severity)) {
    throw new Error("Invalid audit log severity");
  }

  if (
    typeof row.eventId !== "string" ||
    typeof row.eventType !== "string" ||
    typeof row.occurredAtUTC !== "string" ||
    typeof row.recordedAtUTC !== "string" ||
    typeof row.sourceService !== "string" ||
    typeof row.correlationId !== "string" ||
    typeof row.payload !== "object" ||
    row.payload === null
  ) {
    throw new Error("Invalid audit log item");
  }

  return {
    eventId: row.eventId,
    eventType: row.eventType,
    occurredAtUTC: row.occurredAtUTC,
    recordedAtUTC: row.recordedAtUTC,
    actorId: typeof row.actorId === "string" ? row.actorId : null,
    actorType: typeof row.actorType === "string" ? row.actorType : null,
    sourceService: row.sourceService,
    correlationId: row.correlationId,
    severity: severity as AuditLogItemDto["severity"],
    payload: row.payload as Record<string, unknown>,
  };
}

export function parseAuditLogsQueryDto(input: unknown): AuditLogsQueryDto {
  if (!input || typeof input !== "object") return {};

  const source = input as Record<string, unknown>;
  const page = toOptionalPositiveInt(source.page);
  const pageSize = toOptionalPositiveInt(source.pageSize);
  const type = toOptionalNonEmptyString(source.type);
  const actorId = toOptionalNonEmptyString(source.actorId);
  const severity = toOptionalSeverity(source.severity);
  const from = toOptionalNonEmptyString(source.from);
  const to = toOptionalNonEmptyString(source.to);

  return {
    ...(page ? { page } : {}),
    ...(pageSize ? { pageSize } : {}),
    ...(type ? { type } : {}),
    ...(actorId ? { actorId } : {}),
    ...(severity ? { severity } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
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

function toOptionalNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toOptionalSeverity(value: unknown): AuditLogsQueryDto["severity"] | undefined {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!raw || !ALLOWED_SEVERITIES.has(raw)) return undefined;
  return raw as AuditLogsQueryDto["severity"];
}

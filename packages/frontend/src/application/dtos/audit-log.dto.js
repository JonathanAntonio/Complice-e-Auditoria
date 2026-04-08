const ALLOWED_SEVERITIES = new Set(["low", "medium", "high", "critical"]);

export function parseAuditLogsResponseDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta inválida dos logs de auditoria.");
  }

  const payload = raw;
  if (!Array.isArray(payload.items)) {
    throw new Error("Resposta inválida dos logs de auditoria.");
  }

  return {
    items: payload.items.map(parseAuditLogItemDto),
    page: Number.isInteger(payload.page) ? payload.page : 1,
    pageSize: Number.isInteger(payload.pageSize) ? payload.pageSize : payload.items.length,
    total: Number.isInteger(payload.total) ? payload.total : payload.items.length,
  };
}

function parseAuditLogItemDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Item de auditoria inválido.");
  }

  const payload = raw;
  if (
    typeof payload.eventId !== "string" ||
    typeof payload.eventType !== "string" ||
    typeof payload.occurredAtUTC !== "string" ||
    typeof payload.sourceService !== "string" ||
    typeof payload.correlationId !== "string"
  ) {
    throw new Error("Item de auditoria inválido.");
  }

  const severity = typeof payload.severity === "string" ? payload.severity.toLowerCase() : "medium";

  return {
    eventId: payload.eventId,
    eventType: payload.eventType,
    occurredAtUTC: payload.occurredAtUTC,
    recordedAtUTC: typeof payload.recordedAtUTC === "string" ? payload.recordedAtUTC : payload.occurredAtUTC,
    sourceService: payload.sourceService,
    correlationId: payload.correlationId,
    actorId: typeof payload.actorId === "string" ? payload.actorId : null,
    actorType: typeof payload.actorType === "string" ? payload.actorType : null,
    severity: ALLOWED_SEVERITIES.has(severity) ? severity : "medium",
    payload: payload.payload && typeof payload.payload === "object" ? payload.payload : {},
  };
}

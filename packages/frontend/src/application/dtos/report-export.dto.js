const ALLOWED_FORMATS = new Set(["csv", "pdf"]);
const ALLOWED_SCOPES = new Set(["violations", "audit", "risk"]);

export function parseCreateReportExportInputDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Payload inválido para exportação.");
  }

  const payload = raw;
  const format = typeof payload.format === "string" ? payload.format.trim().toLowerCase() : "csv";
  const scope = typeof payload.scope === "string" ? payload.scope.trim().toLowerCase() : "";

  if (!ALLOWED_FORMATS.has(format)) {
    throw new Error("Formato de exportação inválido.");
  }
  if (!ALLOWED_SCOPES.has(scope)) {
    throw new Error("Escopo de exportação inválido.");
  }

  const dto = { format, scope };
  if (typeof payload.requestedBy === "string" && payload.requestedBy.trim()) {
    dto.requestedBy = payload.requestedBy.trim();
  }
  if (payload.filters && typeof payload.filters === "object" && !Array.isArray(payload.filters)) {
    dto.filters = payload.filters;
  }

  return dto;
}

export function parseReportExportJobDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta inválida da exportação.");
  }

  const payload = raw;
  if (
    typeof payload.id !== "string" ||
    typeof payload.format !== "string" ||
    typeof payload.scope !== "string" ||
    typeof payload.requestedBy !== "string" ||
    typeof payload.status !== "string" ||
    typeof payload.createdAtUTC !== "string"
  ) {
    throw new Error("Resposta inválida da exportação.");
  }

  const format = payload.format.toLowerCase();
  const scope = payload.scope.toLowerCase();
  if (!ALLOWED_FORMATS.has(format) || !ALLOWED_SCOPES.has(scope)) {
    throw new Error("Resposta inválida da exportação.");
  }

  return {
    id: payload.id,
    format,
    scope,
    requestedBy: payload.requestedBy,
    status: payload.status,
    createdAtUTC: payload.createdAtUTC,
    completedAtUTC: typeof payload.completedAtUTC === "string" ? payload.completedAtUTC : null,
  };
}

const ALLOWED_SEVERITIES = new Set(["baixa", "media", "alta"]);

export function parseComplianceItemDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta inválida de violação.");
  }

  const payload = raw;
  if (
    typeof payload.id !== "string" ||
    typeof payload.title !== "string" ||
    typeof payload.severity !== "string" ||
    typeof payload.status !== "string" ||
    typeof payload.createdAt !== "string"
  ) {
    throw new Error("Resposta inválida de violação.");
  }

  return {
    id: payload.id,
    title: payload.title,
    severity: payload.severity,
    status: payload.status,
    createdAt: payload.createdAt,
  };
}

export function parseComplianceItemsDto(raw) {
  if (!Array.isArray(raw)) {
    throw new Error("Resposta inválida da listagem de violações.");
  }

  return raw.map((item) => parseComplianceItemDto(item));
}

export function parseCreateComplianceInputDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Payload inválido para criação de violação.");
  }

  const payload = raw;
  if (typeof payload.title !== "string") {
    throw new Error("Título da violação inválido.");
  }

  const title = payload.title.trim();
  if (title.length < 3 || title.length > 120) {
    throw new Error("Título deve ter entre 3 e 120 caracteres.");
  }

  const severity = typeof payload.severity === "string"
    ? payload.severity.trim().toLowerCase()
    : "media";
  if (!ALLOWED_SEVERITIES.has(severity)) {
    throw new Error("Severidade inválida. Use baixa, media ou alta.");
  }

  return {
    title,
    severity,
  };
}

export function parseUpdateComplianceInputDto(raw) {
  return parseCreateComplianceInputDto(raw);
}

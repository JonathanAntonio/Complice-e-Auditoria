const ALLOWED_SEVERITIES = new Set(["baixa", "media", "alta"]);
const ALLOWED_STATUSES = new Set(["aberta", "em_analise", "resolvida", "dispensada"]);

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
  if (!raw || typeof raw !== "object") {
    throw new Error("Payload inválido para edição de violação.");
  }

  const payload = raw;
  const output = {};

  if (payload.title !== undefined) {
    if (typeof payload.title !== "string") {
      throw new Error("Título da violação inválido.");
    }
    const title = payload.title.trim();
    if (title.length < 3 || title.length > 120) {
      throw new Error("Título deve ter entre 3 e 120 caracteres.");
    }
    output.title = title;
  }

  if (payload.severity !== undefined) {
    const severity = typeof payload.severity === "string"
      ? payload.severity.trim().toLowerCase()
      : "";
    if (!ALLOWED_SEVERITIES.has(severity)) {
      throw new Error("Severidade inválida. Use baixa, media ou alta.");
    }
    output.severity = severity;
  }

  if (payload.status !== undefined) {
    const status = typeof payload.status === "string"
      ? payload.status.trim().toLowerCase()
      : "";
    if (!ALLOWED_STATUSES.has(status)) {
      throw new Error("Status inválido. Use aberta, em_analise, resolvida ou dispensada.");
    }
    output.status = status;
  }

  if (!output.title && !output.severity && !output.status) {
    throw new Error("Informe ao menos um campo para editar.");
  }

  return output;
}

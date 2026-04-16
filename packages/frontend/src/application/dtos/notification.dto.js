const ALLOWED_CHANNELS = new Set(["email", "webhook"]);
const ALLOWED_SEVERITIES = new Set(["low", "medium", "high", "critical"]);
const ALLOWED_STATUSES = new Set(["sent", "failed", "dead_letter"]);

export function parseNotificationLogsResponseDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta inválida dos logs de notificação.");
  }

  const payload = raw;
  if (!Array.isArray(payload.items)) {
    throw new Error("Resposta inválida dos logs de notificação.");
  }

  return {
    items: payload.items.map((item) => parseNotificationLogItemDto(item)),
    generatedAtUTC: typeof payload.generatedAtUTC === "string" ? payload.generatedAtUTC : new Date().toISOString(),
  };
}

export function parseDispatchNotificationInputDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Payload inválido de notificação.");
  }

  const payload = raw;
  const channel = typeof payload.channel === "string" ? payload.channel.trim().toLowerCase() : "";
  const severity = typeof payload.severity === "string" ? payload.severity.trim().toLowerCase() : "";
  const recipient = typeof payload.recipient === "string" ? payload.recipient.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";

  if (!ALLOWED_CHANNELS.has(channel)) throw new Error("Canal de notificação inválido.");
  if (!ALLOWED_SEVERITIES.has(severity)) throw new Error("Severidade da notificação inválida.");
  if (!recipient) throw new Error("Destinatário da notificação inválido.");
  if (!message) throw new Error("Mensagem da notificação inválida.");

  const dto = { channel, severity, recipient, message };
  if (Number.isInteger(payload.maxRetries) && payload.maxRetries > 0 && payload.maxRetries <= 3) {
    dto.maxRetries = payload.maxRetries;
  }

  return dto;
}

export function parseNotificationDispatchResultDto(raw) {
  return parseNotificationLogItemDto(raw);
}

function parseNotificationLogItemDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Item de notificação inválido.");
  }

  const payload = raw;
  if (
    typeof payload.id !== "string" ||
    typeof payload.channel !== "string" ||
    typeof payload.recipient !== "string" ||
    typeof payload.severity !== "string" ||
    typeof payload.status !== "string" ||
    typeof payload.attempts !== "number" ||
    typeof payload.createdAtUTC !== "string"
  ) {
    throw new Error("Item de notificação inválido.");
  }

  const channel = payload.channel.toLowerCase();
  const severity = payload.severity.toLowerCase();
  const status = payload.status.toLowerCase();

  if (!ALLOWED_CHANNELS.has(channel) || !ALLOWED_SEVERITIES.has(severity) || !ALLOWED_STATUSES.has(status)) {
    throw new Error("Item de notificação inválido.");
  }

  return {
    id: payload.id,
    channel,
    recipient: payload.recipient,
    severity,
    status,
    attempts: payload.attempts,
    createdAtUTC: payload.createdAtUTC,
    deliveredAtUTC: typeof payload.deliveredAtUTC === "string" ? payload.deliveredAtUTC : null,
    lastError: typeof payload.lastError === "string" ? payload.lastError : null,
  };
}

export interface DispatchNotificationDto {
  channel: "email" | "webhook";
  recipient: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  maxRetries?: number;
}

export interface NotificationDispatchResultDto {
  id: string;
  channel: "email" | "webhook";
  recipient: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "sent" | "failed" | "dead_letter";
  attempts: number;
  createdAtUTC: string;
  deliveredAtUTC?: string;
  lastError?: string;
}

export interface NotificationLogsListDto {
  items: NotificationDispatchResultDto[];
  generatedAtUTC: string;
}

export function parseDispatchNotificationDto(raw: unknown): DispatchNotificationDto | null {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as Record<string, unknown>;
  const channel = typeof payload.channel === "string" ? payload.channel.trim().toLowerCase() : "";
  const severity = typeof payload.severity === "string" ? payload.severity.trim().toLowerCase() : "";
  const recipient = typeof payload.recipient === "string" ? payload.recipient.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";

  if (
    (channel !== "email" && channel !== "webhook") ||
    (severity !== "low" && severity !== "medium" && severity !== "high" && severity !== "critical") ||
    !recipient ||
    !message
  ) {
    return null;
  }

  const dto: DispatchNotificationDto = {
    channel,
    recipient,
    severity,
    message,
  };

  if (typeof payload.maxRetries === "number" && Number.isInteger(payload.maxRetries) && payload.maxRetries > 0) {
    dto.maxRetries = payload.maxRetries;
  }

  return dto;
}

export function parseNotificationDispatchResultDto(raw: unknown): NotificationDispatchResultDto {
  if (!raw || typeof raw !== "object") throw new Error("Invalid notification response");
  const payload = raw as Record<string, unknown>;
  if (
    typeof payload.id !== "string" ||
    typeof payload.channel !== "string" ||
    typeof payload.recipient !== "string" ||
    typeof payload.severity !== "string" ||
    typeof payload.status !== "string" ||
    typeof payload.attempts !== "number" ||
    typeof payload.createdAtUTC !== "string"
  ) {
    throw new Error("Invalid notification response");
  }

  return {
    id: payload.id,
    channel: payload.channel as NotificationDispatchResultDto["channel"],
    recipient: payload.recipient,
    severity: payload.severity as NotificationDispatchResultDto["severity"],
    status: payload.status as NotificationDispatchResultDto["status"],
    attempts: payload.attempts,
    createdAtUTC: payload.createdAtUTC,
    deliveredAtUTC: typeof payload.deliveredAtUTC === "string" ? payload.deliveredAtUTC : undefined,
    lastError: typeof payload.lastError === "string" ? payload.lastError : undefined,
  };
}

export function parseNotificationLogsListDto(raw: unknown): NotificationLogsListDto {
  if (!raw || typeof raw !== "object") throw new Error("Invalid notification logs response");
  const payload = raw as { items?: unknown; generatedAtUTC?: unknown };
  if (!Array.isArray(payload.items) || typeof payload.generatedAtUTC !== "string") {
    throw new Error("Invalid notification logs response");
  }

  return {
    items: payload.items.map((item) => parseNotificationDispatchResultDto(item)),
    generatedAtUTC: payload.generatedAtUTC,
  };
}

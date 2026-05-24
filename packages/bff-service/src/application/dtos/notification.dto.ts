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

export interface NotificationPreferenceDto {
  recipient: string;
  channels: Array<"email" | "webhook">;
  frequency: "immediate" | "hourly_digest" | "daily_digest";
  grouping: boolean;
  muteLowMedium: boolean;
  updatedAtUTC: string;
}

export interface UpsertNotificationPreferenceDto {
  channels: Array<"email" | "webhook">;
  frequency?: "immediate" | "hourly_digest" | "daily_digest";
  grouping?: boolean;
  muteLowMedium?: boolean;
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

export function parseUpsertNotificationPreferenceDto(raw: unknown): UpsertNotificationPreferenceDto | null {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as Record<string, unknown>;
  if (!Array.isArray(payload.channels)) return null;
  const channels = [...new Set(payload.channels
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is "email" | "webhook" => item === "email" || item === "webhook"))];
  if (channels.length === 0) return null;

  const dto: UpsertNotificationPreferenceDto = { channels };
  if (typeof payload.frequency === "string") {
    const frequency = payload.frequency.trim().toLowerCase();
    if (frequency === "immediate" || frequency === "hourly_digest" || frequency === "daily_digest") {
      dto.frequency = frequency;
    }
  }
  if (typeof payload.grouping === "boolean") {
    dto.grouping = payload.grouping;
  }
  if (typeof payload.muteLowMedium === "boolean") {
    dto.muteLowMedium = payload.muteLowMedium;
  }
  return dto;
}

export function parseNotificationPreferenceDto(raw: unknown): NotificationPreferenceDto {
  if (!raw || typeof raw !== "object") throw new Error("Invalid notification preference response");
  const payload = raw as Record<string, unknown>;
  if (
    typeof payload.recipient !== "string" ||
    !Array.isArray(payload.channels) ||
    typeof payload.frequency !== "string" ||
    typeof payload.grouping !== "boolean" ||
    typeof payload.muteLowMedium !== "boolean" ||
    typeof payload.updatedAtUTC !== "string"
  ) {
    throw new Error("Invalid notification preference response");
  }

  const channels = payload.channels
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is "email" | "webhook" => item === "email" || item === "webhook");

  return {
    recipient: payload.recipient,
    channels: [...new Set(channels)],
    frequency:
      payload.frequency === "hourly_digest" || payload.frequency === "daily_digest" ? payload.frequency : "immediate",
    grouping: payload.grouping,
    muteLowMedium: payload.muteLowMedium,
    updatedAtUTC: payload.updatedAtUTC,
  };
}

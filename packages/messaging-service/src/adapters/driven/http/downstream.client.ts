export interface AuditLogItem {
  eventId: string;
  eventType: string;
  occurredAtUTC: string;
  sourceService: string;
  correlationId: string;
}

export interface AuditLogsResponse {
  items: AuditLogItem[];
}

export interface NotificationLogItem {
  id: string;
  channel: string;
  recipient: string;
  status: "sent" | "failed" | "dead_letter";
  attempts: number;
  createdAtUTC: string;
}

export interface NotificationLogsResponse {
  items: NotificationLogItem[];
  generatedAtUTC: string;
}

export interface DownstreamClientConfig {
  auditServiceBaseUrl: string;
  notificationServiceBaseUrl: string;
}

export class DownstreamHttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "DownstreamHttpError";
  }
}

export class DownstreamClient {
  constructor(private readonly config: DownstreamClientConfig) {}

  async fetchAuditLogs(authorization: string | undefined, pageSize: number = 60): Promise<AuditLogsResponse> {
    const url = `${this.config.auditServiceBaseUrl}/audit/logs?page=1&pageSize=${pageSize}`;
    const payload = await this.request<unknown>(url, authorization);
    if (!payload || typeof payload !== "object" || !Array.isArray((payload as { items?: unknown }).items)) {
      throw new Error("Invalid audit logs payload");
    }
    return payload as AuditLogsResponse;
  }

  async fetchNotificationLogs(authorization: string | undefined): Promise<NotificationLogsResponse> {
    const url = `${this.config.notificationServiceBaseUrl}/notifications/logs`;
    const payload = await this.request<unknown>(url, authorization);
    if (!payload || typeof payload !== "object" || !Array.isArray((payload as { items?: unknown }).items)) {
      throw new Error("Invalid notification logs payload");
    }
    return payload as NotificationLogsResponse;
  }

  private async request<T>(url: string, authorization: string | undefined): Promise<T> {
    const headers = new Headers({ Accept: "application/json" });
    if (authorization) {
      headers.set("Authorization", authorization);
    }

    const response = await fetch(url, { method: "GET", headers });
    const payload = await parsePayload(response);

    if (!response.ok) {
      const message = payloadMessage(payload, `Downstream request failed (${response.status})`);
      throw new DownstreamHttpError(response.status, message);
    }

    return payload as T;
  }
}

async function parsePayload(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

function payloadMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const candidate = payload as { message?: unknown; error?: unknown };
    if (typeof candidate.message === "string" && candidate.message.length > 0) return candidate.message;
    if (typeof candidate.error === "string" && candidate.error.length > 0) return candidate.error;
  }
  if (typeof payload === "string" && payload.length > 0) return payload;
  return fallback;
}

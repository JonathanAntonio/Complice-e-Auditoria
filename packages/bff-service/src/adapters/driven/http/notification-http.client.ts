import { UpstreamHttpError } from "../../../application/errors/upstream-http.error";
import type { INotificationClient } from "../../../application/ports";
import {
  parseNotificationPreferenceDto,
  parseNotificationDispatchResultDto,
  parseNotificationLogsListDto,
  type DispatchNotificationDto,
  type NotificationPreferenceDto,
  type NotificationDispatchResultDto,
  type NotificationLogsListDto,
  type UpsertNotificationPreferenceDto,
} from "../../../application/dtos";

export interface NotificationHttpClientConfig {
  gatewayBaseUrl: string;
  notificationBasePath: string;
}

export class NotificationHttpClient implements INotificationClient {
  constructor(private readonly config: NotificationHttpClientConfig) {}

  async dispatchNotification(
    token: string,
    payload: DispatchNotificationDto
  ): Promise<NotificationDispatchResultDto> {
    const result = await this.request<unknown>("/notifications/dispatch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return parseNotificationDispatchResultDto(result);
  }

  async listNotificationLogs(token: string): Promise<NotificationLogsListDto> {
    const result = await this.request<unknown>("/notifications/logs", {
      headers: { Authorization: `Bearer ${token}` },
    });

    return parseNotificationLogsListDto(result);
  }

  async getNotificationPreference(token: string, recipient: string): Promise<NotificationPreferenceDto> {
    const encodedRecipient = encodeURIComponent(recipient.trim().toLowerCase());
    const result = await this.request<unknown>(`/notifications/preferences/${encodedRecipient}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return parseNotificationPreferenceDto(result);
  }

  async upsertNotificationPreference(
    token: string,
    recipient: string,
    payload: UpsertNotificationPreferenceDto
  ): Promise<NotificationPreferenceDto> {
    const encodedRecipient = encodeURIComponent(recipient.trim().toLowerCase());
    const result = await this.request<unknown>(`/notifications/preferences/${encodedRecipient}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return parseNotificationPreferenceDto(result);
  }

  private async request<T>(pathWithQuery: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    const response = await fetch(`${this.config.gatewayBaseUrl}${this.config.notificationBasePath}${pathWithQuery}`, {
      ...init,
      headers,
    });

    const payload = await parseHttpPayload(response);

    if (!response.ok) {
      throw new UpstreamHttpError(
        response.status,
        payloadMessage(payload, `Notification request failed (${response.status})`)
      );
    }

    return payload as T;
  }
}

async function parseHttpPayload(response: Response): Promise<unknown> {
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

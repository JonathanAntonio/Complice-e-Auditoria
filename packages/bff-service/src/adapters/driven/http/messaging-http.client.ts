import { UpstreamHttpError } from "../../../application/errors/upstream-http.error";
import type { IMessagingFlowClient } from "../../../application/ports/messaging-flow-client.port";
import {
  parseMessagingFlowSnapshotDto,
  type MessagingFlowQueryDto,
  type MessagingFlowSnapshotDto,
} from "../../../application/dtos/messaging-flow.dto";

export interface MessagingHttpClientConfig {
  gatewayBaseUrl: string;
  messagingBasePath: string;
}

export class MessagingHttpClient implements IMessagingFlowClient {
  constructor(private readonly config: MessagingHttpClientConfig) {}

  async getMessagingFlow(token: string, query: MessagingFlowQueryDto = {}): Promise<MessagingFlowSnapshotDto> {
    const queryString = toQueryString(query);
    const payload = await this.request<unknown>(`/messaging/flow${queryString ? `?${queryString}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return parseMessagingFlowSnapshotDto(payload);
  }

  private async request<T>(pathWithQuery: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    const response = await fetch(`${this.config.gatewayBaseUrl}${this.config.messagingBasePath}${pathWithQuery}`, {
      ...init,
      headers,
    });
    const payload = await parseHttpPayload(response);
    if (!response.ok) {
      throw new UpstreamHttpError(
        response.status,
        payloadMessage(payload, `Messaging request failed (${response.status})`),
      );
    }
    return payload as T;
  }
}

function toQueryString(query: MessagingFlowQueryDto): string {
  const params = new URLSearchParams();
  if (query.sourceService) params.set("sourceService", query.sourceService);
  if (query.eventType) params.set("eventType", query.eventType);
  if (query.correlationId) params.set("correlationId", query.correlationId);
  if (query.notificationStatus) params.set("notificationStatus", query.notificationStatus);
  if (typeof query.onlyFailures === "boolean") params.set("onlyFailures", `${query.onlyFailures}`);
  if (query.auditLimit) params.set("auditLimit", `${query.auditLimit}`);
  if (query.failuresLimit) params.set("failuresLimit", `${query.failuresLimit}`);
  return params.toString();
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

import { UpstreamHttpError } from "../../../application/errors/upstream-http.error";
import type { IAuditLogsClient } from "../../../application/ports/audit-logs-client.port";
import {
  parseAuditLogListResponseDto,
  type AuditLogsQueryDto,
} from "../../../application/dtos/audit-log-response.dto";

export interface AuditHttpClientConfig {
  gatewayBaseUrl: string;
  auditBasePath: string;
}

export class AuditHttpClient implements IAuditLogsClient {
  constructor(private readonly config: AuditHttpClientConfig) {}

  async listAuditLogs(token: string, query: AuditLogsQueryDto) {
    const queryString = toQueryString(query);
    const payload = await this.request<unknown>(`/audit/logs${queryString ? `?${queryString}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return parseAuditLogListResponseDto(payload);
  }

  private async request<T>(pathWithQuery: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    const response = await fetch(`${this.config.gatewayBaseUrl}${this.config.auditBasePath}${pathWithQuery}`, {
      ...init,
      headers,
    });

    const payload = await parseHttpPayload(response);

    if (!response.ok) {
      throw new UpstreamHttpError(response.status, payloadMessage(payload, `Audit request failed (${response.status})`));
    }

    return payload as T;
  }
}

function toQueryString(query: AuditLogsQueryDto): string {
  const params = new URLSearchParams();

  if (query.page) params.set("page", `${query.page}`);
  if (query.pageSize) params.set("pageSize", `${query.pageSize}`);
  if (query.type) params.set("type", query.type);
  if (query.actorId) params.set("actorId", query.actorId);
  if (query.severity) params.set("severity", query.severity);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);

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

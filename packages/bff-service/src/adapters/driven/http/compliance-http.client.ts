import { UpstreamHttpError } from "../../../application/errors/upstream-http.error";
import type { IComplianceViolationsClient } from "../../../application/ports/compliance-violations-client.port";
import type { CreateComplianceViolationDto } from "../../../application/dtos/create-compliance-violation.dto";
import type { UpdateComplianceViolationDto } from "../../../application/dtos/update-compliance-violation.dto";
import {
  parseComplianceViolationListResponseDto,
  parseComplianceViolationResponseDto,
} from "../../../application/dtos/compliance-item-response.dto";

export interface ComplianceHttpClientConfig {
  gatewayBaseUrl: string;
  complianceBasePath: string;
}

export class ComplianceHttpClient implements IComplianceViolationsClient {
  constructor(private readonly config: ComplianceHttpClientConfig) {}

  async listViolations(token: string) {
    const payload = await this.request<unknown>("/violations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return parseComplianceViolationListResponseDto(payload);
  }

  async createViolation(token: string, payload: CreateComplianceViolationDto) {
    const created = await this.request<unknown>("/violations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return parseComplianceViolationResponseDto(created);
  }

  async updateViolation(token: string, violationId: string, payload: UpdateComplianceViolationDto) {
    const updated = await this.request<unknown>(`/violations/${encodeURIComponent(violationId)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return parseComplianceViolationResponseDto(updated);
  }

  private async request<T>(pathWithQuery: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    const response = await fetch(`${this.config.gatewayBaseUrl}${this.config.complianceBasePath}${pathWithQuery}`, {
      ...init,
      headers,
    });

    const payload = await parseHttpPayload(response);

    if (!response.ok) {
      throw new UpstreamHttpError(response.status, payloadMessage(payload, `Compliance request failed (${response.status})`));
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

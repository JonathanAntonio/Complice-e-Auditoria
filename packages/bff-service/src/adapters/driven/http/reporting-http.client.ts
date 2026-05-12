import { UpstreamHttpError } from "../../../application/errors/upstream-http.error";
import type { IReportingClient } from "../../../application/ports";
import {
  parseReportExportJobDto,
  type CreateReportExportDto,
  type ReportDownloadDto,
  type ReportExportJobDto,
} from "../../../application/dtos";

export interface ReportingHttpClientConfig {
  gatewayBaseUrl: string;
  reportingBasePath: string;
}

export class ReportingHttpClient implements IReportingClient {
  constructor(private readonly config: ReportingHttpClientConfig) {}

  async createExport(token: string, payload: CreateReportExportDto): Promise<ReportExportJobDto> {
    const created = await this.request<unknown>("/reports/exports", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return parseReportExportJobDto(created);
  }

  async getExport(token: string, id: string): Promise<ReportExportJobDto> {
    const result = await this.request<unknown>(`/reports/exports/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return parseReportExportJobDto(result);
  }

  async downloadExport(token: string, id: string): Promise<ReportDownloadDto> {
    const response = await fetch(
      `${this.config.gatewayBaseUrl}${this.config.reportingBasePath}/reports/exports/${encodeURIComponent(id)}/download`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "*/*",
        },
      }
    );

    const body = await response.text();
    if (!response.ok) {
      throw new UpstreamHttpError(response.status, body || `Reporting download failed (${response.status})`);
    }

    return {
      contentType: response.headers.get("content-type") ?? "application/octet-stream",
      contentDisposition: response.headers.get("content-disposition") ?? `attachment; filename="report-${id}"`,
      body,
    };
  }

  private async request<T>(pathWithQuery: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    const response = await fetch(`${this.config.gatewayBaseUrl}${this.config.reportingBasePath}${pathWithQuery}`, {
      ...init,
      headers,
    });

    const payload = await parseHttpPayload(response);

    if (!response.ok) {
      throw new UpstreamHttpError(
        response.status,
        payloadMessage(payload, `Reporting request failed (${response.status})`)
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

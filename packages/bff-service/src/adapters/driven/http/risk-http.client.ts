import { UpstreamHttpError } from "../../../application/errors/upstream-http.error";
import type { IRiskScoresClient } from "../../../application/ports/risk-scores-client.port";
import {
  parseRiskEventIngestResultDto,
  type RiskEventIngestResultDto,
  type RiskEventInputDto,
  parseRiskScoreHistoryDto,
  type RiskScoreHistoryDto,
  type RiskScoreHistoryQueryDto,
  parseRiskScoresListDto,
  type RiskScoresListDto,
  type RiskScoresQueryDto,
} from "../../../application/dtos/risk-score.dto";

export interface RiskHttpClientConfig {
  gatewayBaseUrl: string;
  riskBasePath: string;
}

export class RiskHttpClient implements IRiskScoresClient {
  constructor(private readonly config: RiskHttpClientConfig) {}

  async listRiskScores(token: string, query: RiskScoresQueryDto): Promise<RiskScoresListDto> {
    const queryString = toQueryString(query);
    const payload = await this.request<unknown>(`/risk/scores${queryString ? `?${queryString}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return parseRiskScoresListDto(payload);
  }

  async getRiskScoreHistory(
    token: string,
    entityType: "user" | "area" | "process",
    entityId: string,
    query: RiskScoreHistoryQueryDto
  ): Promise<RiskScoreHistoryDto> {
    const queryString = toHistoryQueryString(query);
    const payload = await this.request<unknown>(
      `/risk/scores/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/history${queryString ? `?${queryString}` : ""}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return parseRiskScoreHistoryDto(payload);
  }

  async ingestRiskEvent(token: string, payload: RiskEventInputDto): Promise<RiskEventIngestResultDto> {
    const response = await this.request<unknown>("/risk/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return parseRiskEventIngestResultDto(response);
  }

  private async request<T>(pathWithQuery: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    const response = await fetch(`${this.config.gatewayBaseUrl}${this.config.riskBasePath}${pathWithQuery}`, {
      ...init,
      headers,
    });

    const payload = await parseHttpPayload(response);

    if (!response.ok) {
      throw new UpstreamHttpError(response.status, payloadMessage(payload, `Risk request failed (${response.status})`));
    }

    return payload as T;
  }
}

function toQueryString(query: RiskScoresQueryDto): string {
  const params = new URLSearchParams();
  if (query.entityType) params.set("entityType", query.entityType);
  if (query.level) params.set("level", query.level);
  if (query.search) params.set("search", query.search);
  if (query.minScore !== undefined) params.set("minScore", String(query.minScore));
  if (query.maxScore !== undefined) params.set("maxScore", String(query.maxScore));
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.pageSize !== undefined) params.set("pageSize", String(query.pageSize));
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortDir) params.set("sortDir", query.sortDir);
  return params.toString();
}

function toHistoryQueryString(query: RiskScoreHistoryQueryDto): string {
  const params = new URLSearchParams();
  if (query.fromUTC) params.set("fromUTC", query.fromUTC);
  if (query.toUTC) params.set("toUTC", query.toUTC);
  if (query.bucket) params.set("bucket", query.bucket);
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

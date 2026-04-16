import { createEventEnvelopeV1 } from "@lframework/shared";
import { UpstreamHttpError } from "../../../application/errors/upstream-http.error";

export interface IntegrationAuditHttpClientConfig {
  gatewayBaseUrl: string;
  integrationBasePath: string;
  integrationApiKey: string;
}

export interface IntegrationPublishResult {
  accepted: boolean;
  duplicate: boolean;
  eventId: string;
}

export class IntegrationAuditHttpClient {
  constructor(private readonly config: IntegrationAuditHttpClientConfig) {}

  async publish(type: string, payload: Record<string, unknown>, correlationId?: string): Promise<void> {
    await this.publishEvent(type, payload, correlationId);
  }

  async publishEvent(type: string, payload: Record<string, unknown>, correlationId?: string): Promise<IntegrationPublishResult> {
    if (!this.config.integrationApiKey.trim()) {
      throw new Error("BFF_INTEGRATION_API_KEY is not configured");
    }

    const envelope = createEventEnvelopeV1({
      type,
      producer: "bff-service",
      correlationId,
      payload,
    });

    const response = await fetch(`${this.config.gatewayBaseUrl}${this.config.integrationBasePath}/integrations/events`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": this.config.integrationApiKey,
      },
      body: JSON.stringify(envelope),
    });

    const body = await response.text();
    if (!response.ok) {
      throw new UpstreamHttpError(response.status, body || `Integration audit publish failed (${response.status})`);
    }

    try {
      const parsed = body ? JSON.parse(body) as Record<string, unknown> : {};
      return {
        accepted: Boolean(parsed.accepted),
        duplicate: Boolean(parsed.duplicate),
        eventId: typeof parsed.eventId === "string" ? parsed.eventId : "",
      };
    } catch {
      return {
        accepted: true,
        duplicate: false,
        eventId: "",
      };
    }
  }
}

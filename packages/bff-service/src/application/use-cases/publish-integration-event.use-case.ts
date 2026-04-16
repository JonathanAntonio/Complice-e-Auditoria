import { IntegrationAuditHttpClient } from "../../adapters/driven/http/integration-audit-http.client";
import type { PublishIntegrationEventDto } from "../dtos/publish-integration-event.dto";

export class PublishIntegrationEventUseCase {
  constructor(private readonly publisher: IntegrationAuditHttpClient) {}

  async execute(payload: PublishIntegrationEventDto) {
    return this.publisher.publishEvent(payload.type, payload.payload, payload.correlationId);
  }
}

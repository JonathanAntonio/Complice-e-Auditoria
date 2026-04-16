import { requestBffIntegration } from "../infrastructure/http/bff-integration.api";
import {
  parsePublishIntegrationEventInputDto,
  parsePublishIntegrationEventResultDto,
} from "./dtos/integration-event.dto";

export async function publishIntegrationEvent(input) {
  const dto = parsePublishIntegrationEventInputDto(input);
  const payload = await requestBffIntegration("/events", {
    method: "POST",
    body: dto,
    defaultErrorMessage: "Falha ao publicar evento de integração.",
  });
  return parsePublishIntegrationEventResultDto(payload);
}

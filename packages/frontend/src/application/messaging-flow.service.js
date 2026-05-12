import { requestBffMessaging } from "../infrastructure/http/bff-messaging.api";
import { parseMessagingFlowSnapshotDto } from "./dtos/messaging-flow.dto";

export async function getMessagingFlowSnapshot(query = {}) {
  const params = new URLSearchParams();
  if (query.sourceService) params.set("sourceService", query.sourceService);
  if (query.eventType) params.set("eventType", query.eventType);
  if (query.correlationId) params.set("correlationId", query.correlationId);
  if (query.notificationStatus) params.set("notificationStatus", query.notificationStatus);
  if (typeof query.onlyFailures === "boolean") params.set("onlyFailures", `${query.onlyFailures}`);
  if (query.auditLimit) params.set("auditLimit", `${query.auditLimit}`);
  if (query.failuresLimit) params.set("failuresLimit", `${query.failuresLimit}`);

  const suffix = params.size > 0 ? `/flow?${params.toString()}` : "/flow";
  const payload = await requestBffMessaging(suffix, {
    defaultErrorMessage: "Falha ao carregar fluxo de mensageria.",
  });
  return parseMessagingFlowSnapshotDto(payload);
}

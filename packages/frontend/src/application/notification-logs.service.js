import { requestBffNotification } from "../infrastructure/http/bff-notification.api";
import {
  parseDispatchNotificationInputDto,
  parseNotificationDispatchResultDto,
  parseNotificationLogsResponseDto,
} from "./dtos/notification.dto";

export async function listNotificationLogs() {
  const payload = await requestBffNotification("/logs", {
    defaultErrorMessage: "Falha ao carregar logs de notificação.",
  });
  return parseNotificationLogsResponseDto(payload);
}

export async function dispatchNotification(input) {
  const dto = parseDispatchNotificationInputDto(input);
  const payload = await requestBffNotification("/dispatch", {
    method: "POST",
    body: dto,
    defaultErrorMessage: "Falha ao enviar notificação.",
  });

  return parseNotificationDispatchResultDto(payload);
}

import { requestBffNotification } from "../infrastructure/http/bff-notification.api";
import {
  parseDispatchNotificationInputDto,
  parseNotificationPreferenceDto,
  parseNotificationDispatchResultDto,
  parseNotificationLogsResponseDto,
  parseUpsertNotificationPreferenceInputDto,
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

export async function getNotificationPreference(recipient) {
  const key = String(recipient ?? "").trim().toLowerCase();
  if (!key) throw new Error("Destinatário é obrigatório.");
  const payload = await requestBffNotification(`/preferences/${encodeURIComponent(key)}`, {
    defaultErrorMessage: "Falha ao carregar preferências de notificação.",
  });
  return parseNotificationPreferenceDto(payload);
}

export async function upsertNotificationPreference(recipient, input) {
  const key = String(recipient ?? "").trim().toLowerCase();
  if (!key) throw new Error("Destinatário é obrigatório.");
  const dto = parseUpsertNotificationPreferenceInputDto(input);
  const payload = await requestBffNotification(`/preferences/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: dto,
    defaultErrorMessage: "Falha ao atualizar preferências de notificação.",
  });
  return parseNotificationPreferenceDto(payload);
}

import type {
  DispatchNotificationDto,
  NotificationPreferenceDto,
  NotificationDispatchResultDto,
  NotificationLogsListDto,
  UpsertNotificationPreferenceDto,
} from "../dtos/notification.dto";

export interface INotificationClient {
  dispatchNotification(token: string, payload: DispatchNotificationDto): Promise<NotificationDispatchResultDto>;
  listNotificationLogs(token: string): Promise<NotificationLogsListDto>;
  getNotificationPreference(token: string, recipient: string): Promise<NotificationPreferenceDto>;
  upsertNotificationPreference(
    token: string,
    recipient: string,
    payload: UpsertNotificationPreferenceDto
  ): Promise<NotificationPreferenceDto>;
}

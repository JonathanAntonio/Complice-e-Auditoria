import type {
  DispatchNotificationDto,
  NotificationDispatchResultDto,
  NotificationLogsListDto,
} from "../dtos/notification.dto";

export interface INotificationClient {
  dispatchNotification(token: string, payload: DispatchNotificationDto): Promise<NotificationDispatchResultDto>;
  listNotificationLogs(token: string): Promise<NotificationLogsListDto>;
}

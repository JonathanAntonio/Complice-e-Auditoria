import type { NotificationLogsListDto } from "../dtos/notification.dto";
import type { INotificationClient } from "../ports/notification-client.port";

export class ListNotificationLogsUseCase {
  constructor(private readonly client: INotificationClient) {}

  async execute(token: string): Promise<NotificationLogsListDto> {
    return this.client.listNotificationLogs(token);
  }
}

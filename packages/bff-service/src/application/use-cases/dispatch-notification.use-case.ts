import type {
  DispatchNotificationDto,
  NotificationDispatchResultDto,
} from "../dtos/notification.dto";
import type { INotificationClient } from "../ports/notification-client.port";

export class DispatchNotificationUseCase {
  constructor(private readonly client: INotificationClient) {}

  async execute(token: string, payload: DispatchNotificationDto): Promise<NotificationDispatchResultDto> {
    return this.client.dispatchNotification(token, payload);
  }
}

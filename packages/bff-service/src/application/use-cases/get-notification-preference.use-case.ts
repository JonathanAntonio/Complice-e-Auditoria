import type { NotificationPreferenceDto } from "../dtos/notification.dto";
import type { INotificationClient } from "../ports/notification-client.port";

export class GetNotificationPreferenceUseCase {
  constructor(private readonly client: INotificationClient) {}

  async execute(token: string, recipient: string): Promise<NotificationPreferenceDto> {
    return this.client.getNotificationPreference(token, recipient);
  }
}

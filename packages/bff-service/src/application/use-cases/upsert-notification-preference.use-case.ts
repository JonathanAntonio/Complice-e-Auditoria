import type { NotificationPreferenceDto, UpsertNotificationPreferenceDto } from "../dtos/notification.dto";
import type { INotificationClient } from "../ports/notification-client.port";

export class UpsertNotificationPreferenceUseCase {
  constructor(private readonly client: INotificationClient) {}

  async execute(token: string, recipient: string, payload: UpsertNotificationPreferenceDto): Promise<NotificationPreferenceDto> {
    return this.client.upsertNotificationPreference(token, recipient, payload);
  }
}

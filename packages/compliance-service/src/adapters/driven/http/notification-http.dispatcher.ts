import { logger } from "@lframework/shared";
import type {
  INotificationDispatcher,
  ViolationNotificationInput,
} from "../../../application/ports/notification-dispatcher.port";

interface NotificationHttpDispatcherConfig {
  baseUrl: string;
}

export class NotificationHttpDispatcher implements INotificationDispatcher {
  constructor(private readonly config: NotificationHttpDispatcherConfig) {}

  async dispatchViolationNotification(input: ViolationNotificationInput): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/notifications/dispatch`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channel: "email",
        severity: input.severity,
        message: input.message,
        recipient: undefined,
        scopeOwner: input.scopeOwner,
        areaManager: input.areaManager,
        complianceOfficer: input.complianceOfficer,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`notification_dispatch_failed status=${response.status} body=${text}`);
    }

    logger.info(
      {
        title: input.title,
        severity: input.severity,
      },
      "Compliance critical notification dispatched"
    );
  }
}

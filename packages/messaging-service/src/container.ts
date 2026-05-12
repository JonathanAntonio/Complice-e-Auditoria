import { DownstreamClient } from "./adapters/driven/http/downstream.client";
import { MessagingFlowController } from "./adapters/driving/http/messaging-flow.controller";
import { createMessagingRoutes } from "./adapters/driving/http/routes";
import { MessagingFlowService } from "./application/messaging-flow.service";

export interface MessagingContainerConfig {
  auditServiceBaseUrl: string;
  notificationServiceBaseUrl: string;
}

export function createContainer(config: MessagingContainerConfig) {
  const downstreamClient = new DownstreamClient({
    auditServiceBaseUrl: config.auditServiceBaseUrl,
    notificationServiceBaseUrl: config.notificationServiceBaseUrl,
  });
  const messagingFlowService = new MessagingFlowService(downstreamClient);
  const messagingFlowController = new MessagingFlowController(messagingFlowService);
  const routes = createMessagingRoutes(messagingFlowController);

  return { routes };
}

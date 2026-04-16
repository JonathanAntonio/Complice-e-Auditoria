import path from "path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), "../../.env"), override: true });

import { logger } from "@lframework/shared";
import { createApp } from "./app";
import { loadNotificationServiceConfig } from "./app/config";
import { NotificationDispatchService } from "./application/notification-dispatch.service";
import { createNotificationRoutes } from "./adapters/driving/http/routes";

const config = loadNotificationServiceConfig(process.env);
const service = new NotificationDispatchService();
const routes = createNotificationRoutes(service);
const app = createApp({ routes }, { baseUrl: config.baseUrl, corsOrigin: config.corsOrigin });

app.listen(config.port, () => {
  logger.info(`Notification service listening on http://localhost:${config.port}`);
});

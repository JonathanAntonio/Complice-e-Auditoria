import path from "path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), "../../.env"), override: false });

import { logger } from "@lframework/shared";
import { loadMessagingServiceConfig } from "./app/config";
import { createContainer } from "./container";
import { createApp } from "./app";

const config = loadMessagingServiceConfig(process.env);

const container = createContainer({
  auditServiceBaseUrl: config.auditServiceBaseUrl,
  notificationServiceBaseUrl: config.notificationServiceBaseUrl,
});

const app = createApp(container, {
  baseUrl: config.baseUrl,
  corsOrigin: config.corsOrigin,
});

app.listen(config.port, () => {
  logger.info(`Messaging service listening on http://localhost:${config.port}`);
});

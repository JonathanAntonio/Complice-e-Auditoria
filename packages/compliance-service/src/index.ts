import path from "path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { createContainer } from "./container";
import { createApp } from "./app";
import { logger } from "@lframework/shared";
import { loadComplianceServiceConfig } from "./app/config";

const config = loadComplianceServiceConfig(process.env);

async function bootstrap() {
  const container = createContainer({
    databaseUrl: config.databaseUrl,
    redisUrl: config.redisUrl,
    rabbitmqUrl: config.rabbitmqUrl,
    jwtSecret: config.jwtSecret,
  });

  await container.connectRabbitMQ((payload) =>
    container.handleUserCreatedUseCase.execute(payload)
  );

  const app = createApp(container, {
    baseUrl: config.baseUrl,
    corsOrigin: config.corsOrigin,
  });

  app.listen(config.port, () => {
    logger.info(`Compliance service listening on http://localhost:${config.port}`);
  });

  process.on("SIGTERM", async () => {
    try {
      await container.disconnect();
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Disconnect failed on SIGTERM");
      process.exit(1);
    }
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, "Failed to start compliance-service");
  process.exit(1);
});

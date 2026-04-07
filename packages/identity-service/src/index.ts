import path from "path";
import { config as loadEnv } from "dotenv";
import { createContainer } from "./container";
import { createApp } from "./app";
import { logger } from "@lframework/shared";
import { loadIdentityServiceConfig } from "./app/config";

// Em monorepo, prioriza variáveis da raiz e usa .env do serviço como fallback.
loadEnv({ path: path.resolve(process.cwd(), "../../.env") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

const config = loadIdentityServiceConfig(process.env);

async function bootstrap() {
  const container = createContainer({
    databaseUrl: config.databaseUrl,
    redisUrl: config.redisUrl,
    rabbitmqUrl: config.rabbitmqUrl,
    jwtSecret: config.jwtSecret,
    jwtExpiresInSeconds: config.jwtExpiresInSeconds,
    baseUrl: config.baseUrl,
    googleOAuth: config.googleOAuth,
    githubOAuth: config.githubOAuth,
  });

  await container.connectRabbitMQ();
  container.startOutboxRelay(config.outboxRelayIntervalMs);

  const app = createApp(container, {
    corsOrigin: config.corsOrigin,
    baseUrl: config.baseUrl,
  });

  app.listen(config.port, () => {
    logger.info(`Identity service listening on http://localhost:${config.port}`);
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
  logger.error({ err }, "Failed to start identity-service");
  process.exit(1);
});

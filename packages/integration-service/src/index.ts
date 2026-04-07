import path from "path";
import { config as loadEnv } from "dotenv";
import type { Server } from "http";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { logger } from "@lframework/shared";
import { createContainer } from "./container";
import { createApp } from "./app";
import { loadIntegrationServiceConfig } from "./app/config";

const config = loadIntegrationServiceConfig(process.env);

function closeServer(server: Server, timeoutMs: number = 10_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`HTTP server close timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    server.close((err) => {
      clearTimeout(timeout);
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

async function bootstrap() {
  const container = createContainer({
    databaseUrl: config.databaseUrl,
    rabbitmqUrl: config.rabbitmqUrl,
    integrationApiKey: config.integrationApiKey,
  });

  await container.connectRabbitMQ();
  container.startOutboxRelay(config.outboxRelayIntervalMs);

  const app = createApp(container, {
    corsOrigin: config.corsOrigin,
    baseUrl: config.baseUrl,
  });

  const server = app.listen(config.port, () => {
    logger.info(`Integration service listening on http://localhost:${config.port}`);
  });

  let shuttingDown = false;
  const shutdown = async (signal: "SIGTERM" | "SIGINT"): Promise<void> => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    try {
      await closeServer(server);
      logger.info({ signal }, "HTTP server closed");
    } catch (err) {
      logger.error({ err, signal }, "Failed to close HTTP server cleanly");
    }

    try {
      await container.disconnect();
      logger.info({ signal }, "Integration container disconnected");
      process.exit(0);
    } catch (err) {
      logger.error({ err, signal }, "Disconnect failed during shutdown");
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, "Failed to start integration-service");
  process.exit(1);
});

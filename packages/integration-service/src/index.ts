import path from "path";
import { config as loadEnv } from "dotenv";
import type { Server } from "http";

loadEnv({ path: path.resolve(__dirname, "../../../.env") });
loadEnv();

import { logger } from "@lframework/shared";
import { createContainer } from "./container";
import { createApp } from "./app";

const port = parseInt(process.env.INTEGRATION_SERVICE_PORT ?? "3003", 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  logger.error("INTEGRATION_SERVICE_PORT must be a valid port (1-65535)");
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === "production";
if (isProduction && !process.env.INTEGRATION_DATABASE_URL) {
  logger.error("INTEGRATION_DATABASE_URL must be set in production");
  process.exit(1);
}
if (isProduction && !process.env.RABBITMQ_URL) {
  logger.error("RABBITMQ_URL must be set in production");
  process.exit(1);
}
if (!process.env.INTEGRATION_API_KEY || process.env.INTEGRATION_API_KEY.length < 16) {
  logger.error("INTEGRATION_API_KEY must be set and at least 16 chars");
  process.exit(1);
}

const databaseUrl = isProduction
  ? process.env.INTEGRATION_DATABASE_URL!
  : (process.env.INTEGRATION_DATABASE_URL ?? "postgresql://lframework:lframework@localhost:5432/lframework_integration");

const rabbitmqUrl = isProduction
  ? process.env.RABBITMQ_URL!
  : (process.env.RABBITMQ_URL ?? "amqp://lframework:lframework@localhost:5672");
const baseUrl = process.env.INTEGRATION_BASE_URL ?? `http://localhost:${port}`;

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
    databaseUrl,
    rabbitmqUrl,
    integrationApiKey: process.env.INTEGRATION_API_KEY!,
  });

  await container.connectRabbitMQ();
  const outboxRelayIntervalMs = parseInt(process.env.OUTBOX_RELAY_INTERVAL_MS ?? "2000", 10);
  container.startOutboxRelay(Number.isInteger(outboxRelayIntervalMs) && outboxRelayIntervalMs > 0 ? outboxRelayIntervalMs : 2000);

  const app = createApp(container, {
    corsOrigin: process.env.CORS_ORIGIN,
    baseUrl,
  });

  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", container.metrics.registry.contentType);
    res.end(await container.metrics.registry.metrics());
  });

  const server = app.listen(port, () => {
    logger.info(`Integration service listening on http://localhost:${port}`);
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

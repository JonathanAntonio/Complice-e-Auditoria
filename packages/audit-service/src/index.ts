import path from "path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import type { Server } from "http";
import { logger } from "@lframework/shared";
import { createContainer } from "./container";
import { createApp } from "./app";
import { loadAuditServiceConfig } from "./app/config";

const config = loadAuditServiceConfig(process.env);

function closeServer(server: Server, timeoutMs: number = 10_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`HTTP server close timed out after ${timeoutMs}ms`)), timeoutMs);
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
  const container = createContainer(config);
  await container.startConsumer();

  const app = createApp(container, {
    baseUrl: config.baseUrl,
    corsOrigin: config.corsOrigin,
  });

  const server = app.listen(config.port, () => {
    logger.info(`Audit service listening on http://localhost:${config.port}`);
  });

  let shuttingDown = false;
  const shutdown = async (signal: "SIGTERM" | "SIGINT") => {
    if (shuttingDown) return;
    shuttingDown = true;

    try {
      await closeServer(server);
      logger.info({ signal }, "Audit HTTP server closed");
    } catch (err) {
      logger.error({ err, signal }, "Failed to close audit HTTP server");
    }

    try {
      await container.disconnect();
      logger.info({ signal }, "Audit container disconnected");
      process.exit(0);
    } catch (err) {
      logger.error({ err, signal }, "Audit disconnect failed");
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
  logger.error({ err }, "Failed to start audit-service");
  process.exit(1);
});

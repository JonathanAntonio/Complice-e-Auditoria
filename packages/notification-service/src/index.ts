import path from "path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), "../../.env"), override: false });

import {
  logger as baseLogger,
  setLogger,
  wrapWithAudit,
  HttpAuditPublisher,
  logger
} from "@lframework/shared";
import { PrismaClient } from "@prisma/client";
import { createApp } from "./app";
import { loadNotificationServiceConfig } from "./app/config";
import { PrismaNotificationPreferencesRepository } from "./adapters/driven/persistence/prisma-notification-preferences.repository";
import { NotificationDispatchService } from "./application/notification-dispatch.service";
import { NotificationPreferencesService } from "./application/notification-preferences.service";
import { createNotificationRoutes } from "./adapters/driving/http/routes";

const config = loadNotificationServiceConfig(process.env);
const auditFailClosed = process.env.AUDIT_FAIL_CLOSED === "true";

// Inicializa auditoria centralizada via HTTP
const auditServiceUrl = process.env.AUDIT_SERVICE_URL || "http://localhost:3005";
const publisher = new HttpAuditPublisher(auditServiceUrl);
const auditLogger = wrapWithAudit(baseLogger, publisher, "notification-service");
setLogger(auditLogger);

async function bootstrap(): Promise<void> {
  const notificationDatabaseUrl =
    process.env.NOTIFICATION_DATABASE_URL ??
    process.env.COMPLIANCE_DATABASE_URL ??
    "postgresql://lframework:lframework@localhost:5432/lframework";
  const prisma = new PrismaClient({
    datasources: { db: { url: notificationDatabaseUrl } },
  });
  await prisma.$connect();

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down notification-service...");
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  const preferencesRepository = new PrismaNotificationPreferencesRepository(prisma);
  const preferencesService = new NotificationPreferencesService(preferencesRepository);
  const service = new NotificationDispatchService(preferencesService);
  const routes = createNotificationRoutes(service, preferencesService);
  const app = createApp({ routes }, { baseUrl: config.baseUrl, corsOrigin: config.corsOrigin });

  app.listen(config.port, () => {
    logger.info({ auditFailClosed }, `Notification service listening on http://localhost:${config.port}`);
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, "Failed to start notification-service");
  process.exit(1);
});

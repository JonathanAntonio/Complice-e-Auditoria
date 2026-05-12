import { logger } from "@lframework/shared";

export interface NotificationServiceConfig {
  port: number;
  baseUrl: string;
  corsOrigin?: string;
}

export function loadNotificationServiceConfig(env: NodeJS.ProcessEnv): NotificationServiceConfig {
  const port = parseInt(env.NOTIFICATION_SERVICE_PORT ?? "4008", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    logger.error("NOTIFICATION_SERVICE_PORT must be a valid port (1-65535)");
    process.exit(1);
  }

  return {
    port,
    baseUrl: env.NOTIFICATION_BASE_URL ?? `http://localhost:${port}`,
    corsOrigin: env.CORS_ORIGIN,
  };
}

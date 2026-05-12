import { logger } from "@lframework/shared";

export interface MessagingServiceConfig {
  port: number;
  baseUrl: string;
  corsOrigin?: string;
  auditServiceBaseUrl: string;
  notificationServiceBaseUrl: string;
}

export function loadMessagingServiceConfig(env: NodeJS.ProcessEnv): MessagingServiceConfig {
  const port = parseInt(env.MESSAGING_SERVICE_PORT ?? "4011", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    logger.error("MESSAGING_SERVICE_PORT must be a valid port (1-65535)");
    process.exit(1);
  }

  const auditServiceBaseUrl = env.AUDIT_SERVICE_BASE_URL ?? "http://localhost:8080/audit/api/v1";
  const notificationServiceBaseUrl = env.NOTIFICATION_SERVICE_BASE_URL ?? "http://localhost:8080/notification/api/v1";

  return {
    port,
    baseUrl: env.MESSAGING_BASE_URL ?? `http://localhost:${port}`,
    corsOrigin: env.CORS_ORIGIN,
    auditServiceBaseUrl,
    notificationServiceBaseUrl,
  };
}

import { logger } from "@lframework/shared";

export interface AuditServiceConfig {
  port: number;
  databaseUrl: string;
  rabbitmqUrl: string;
  jwtSecret: string;
  baseUrl: string;
  corsOrigin?: string;
}

export function loadAuditServiceConfig(env: NodeJS.ProcessEnv): AuditServiceConfig {
  const port = parseInt(env.AUDIT_SERVICE_PORT ?? "3005", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    logger.error("AUDIT_SERVICE_PORT must be a valid port (1-65535)");
    process.exit(1);
  }

  const isProduction = env.NODE_ENV === "production";
  if (isProduction && !env.AUDIT_DATABASE_URL) {
    logger.error("AUDIT_DATABASE_URL must be set in production");
    process.exit(1);
  }
  if (isProduction && !env.RABBITMQ_URL) {
    logger.error("RABBITMQ_URL must be set in production");
    process.exit(1);
  }
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    logger.error("JWT_SECRET must be set and at least 32 chars");
    process.exit(1);
  }

  return {
    port,
    databaseUrl: isProduction
      ? env.AUDIT_DATABASE_URL!
      : (env.AUDIT_DATABASE_URL ?? "postgresql://lframework:lframework@localhost:5432/lframework_audit"),
    rabbitmqUrl: isProduction
      ? env.RABBITMQ_URL!
      : (env.RABBITMQ_URL ?? "amqp://lframework:lframework@localhost:5672"),
    jwtSecret: env.JWT_SECRET,
    baseUrl: env.AUDIT_BASE_URL ?? `http://localhost:${port}`,
    corsOrigin: env.CORS_ORIGIN,
  };
}

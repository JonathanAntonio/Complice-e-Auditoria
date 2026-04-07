import { logger } from "@lframework/shared";

export interface CatalogServiceConfig {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  rabbitmqUrl: string;
  jwtSecret: string;
  baseUrl: string;
  corsOrigin?: string;
}

export function loadCatalogServiceConfig(env: NodeJS.ProcessEnv): CatalogServiceConfig {
  const port = parseInt(env.CATALOG_SERVICE_PORT ?? "3002", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    logger.error("CATALOG_SERVICE_PORT must be a valid port (1-65535)");
    process.exit(1);
  }
  const isProduction = env.NODE_ENV === "production";

  if (isProduction && !env.CATALOG_DATABASE_URL) {
    logger.error("CATALOG_DATABASE_URL must be set in production");
    process.exit(1);
  }
  if (isProduction && !env.REDIS_URL) {
    logger.error("REDIS_URL must be set in production");
    process.exit(1);
  }
  if (isProduction && !env.RABBITMQ_URL) {
    logger.error("RABBITMQ_URL must be set in production");
    process.exit(1);
  }
  if (isProduction && (!env.JWT_SECRET || env.JWT_SECRET.length < 32)) {
    logger.error("JWT_SECRET must be set and at least 32 characters in production");
    process.exit(1);
  }

  const databaseUrl = isProduction
    ? env.CATALOG_DATABASE_URL!
    : (env.CATALOG_DATABASE_URL ?? "postgresql://lframework:lframework@localhost:5432/lframework");
  const redisUrl = isProduction
    ? env.REDIS_URL!
    : (env.REDIS_URL ?? "redis://localhost:6379");
  const rabbitmqUrl = isProduction
    ? env.RABBITMQ_URL!
    : (env.RABBITMQ_URL ?? "amqp://lframework:lframework@localhost:5672");
  const jwtSecret = env.JWT_SECRET ?? (isProduction ? "" : "dev-secret-min-32-chars-for-jwt-signing");
  const baseUrl = env.BASE_URL ?? `http://localhost:${port}`;

  return {
    port,
    databaseUrl,
    redisUrl,
    rabbitmqUrl,
    jwtSecret,
    baseUrl,
    corsOrigin: env.CORS_ORIGIN,
  };
}

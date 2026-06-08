import { logger } from "@lframework/shared";

export interface IntegrationServiceConfig {
  port: number;
  databaseUrl: string;
  rabbitmqUrl: string;
  integrationApiKey: string;
  baseUrl: string;
  corsOrigin?: string;
  outboxRelayIntervalMs: number;
  complianceBaseUrl: string;
  riskBaseUrl: string;
  auditBaseUrl: string;
  jwtSecret: string;
}

export function loadIntegrationServiceConfig(env: NodeJS.ProcessEnv): IntegrationServiceConfig {
  const port = parseInt(env.INTEGRATION_SERVICE_PORT ?? "4003", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    logger.error("INTEGRATION_SERVICE_PORT must be a valid port (1-65535)");
    process.exit(1);
  }

  const isProduction = env.NODE_ENV === "production";
  if (isProduction && !env.INTEGRATION_DATABASE_URL) {
    logger.error("INTEGRATION_DATABASE_URL must be set in production");
    process.exit(1);
  }
  if (isProduction && !env.RABBITMQ_URL) {
    logger.error("RABBITMQ_URL must be set in production");
    process.exit(1);
  }
  if (!env.INTEGRATION_API_KEY || env.INTEGRATION_API_KEY.length < 16) {
    logger.error("INTEGRATION_API_KEY must be set and at least 16 chars");
    process.exit(1);
  }

  const databaseUrl = isProduction
    ? env.INTEGRATION_DATABASE_URL!
    : (env.INTEGRATION_DATABASE_URL ?? "postgresql://lframework:lframework@localhost:5432/lframework_integration");
  const rabbitmqUrl = isProduction
    ? env.RABBITMQ_URL!
    : (env.RABBITMQ_URL ?? "amqp://lframework:lframework@localhost:5672");

  const outboxRelayIntervalMsRaw = parseInt(env.OUTBOX_RELAY_INTERVAL_MS ?? "2000", 10);
  const outboxRelayIntervalMs =
    Number.isInteger(outboxRelayIntervalMsRaw) && outboxRelayIntervalMsRaw > 0
      ? outboxRelayIntervalMsRaw
      : 2000;

  const complianceBaseUrl = env.COMPLIANCE_BASE_URL ?? "http://localhost:4002";
  const riskBaseUrl = env.RISK_BASE_URL ?? "http://localhost:4006";
  const auditBaseUrl = env.AUDIT_BASE_URL ?? "http://localhost:4005";
  const jwtSecret = env.JWT_SECRET ?? "change-me-in-production-use-a-long-random-secret";

  return {
    port,
    databaseUrl,
    rabbitmqUrl,
    integrationApiKey: env.INTEGRATION_API_KEY,
    baseUrl: env.INTEGRATION_BASE_URL ?? `http://localhost:${port}`,
    corsOrigin: env.CORS_ORIGIN,
    outboxRelayIntervalMs,
    complianceBaseUrl,
    riskBaseUrl,
    auditBaseUrl,
    jwtSecret,
  };
}

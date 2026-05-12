import { logger } from "@lframework/shared";

export interface ComplianceServiceConfig {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  rabbitmqUrl: string;
  jwtSecret: string;
  baseUrl: string;
  corsOrigin?: string;
  retentionSweepIntervalMs: number;
  retentionMinDays: number;
  retentionBatchSize: number;
  retentionScopeStatuses: Array<"resolvida" | "dispensada">;
}

export function loadComplianceServiceConfig(env: NodeJS.ProcessEnv): ComplianceServiceConfig {
  const port = parseInt(env.COMPLIANCE_SERVICE_PORT ?? "4002", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    logger.error("COMPLIANCE_SERVICE_PORT must be a valid port (1-65535)");
    process.exit(1);
  }
  const isProduction = env.NODE_ENV === "production";

  if (isProduction && !env.COMPLIANCE_DATABASE_URL) {
    logger.error("COMPLIANCE_DATABASE_URL must be set in production");
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
    ? env.COMPLIANCE_DATABASE_URL!
    : (env.COMPLIANCE_DATABASE_URL ?? "postgresql://lframework:lframework@localhost:5432/lframework");
  const redisUrl = isProduction
    ? env.REDIS_URL!
    : (env.REDIS_URL ?? "redis://localhost:6379");
  const rabbitmqUrl = isProduction
    ? env.RABBITMQ_URL!
    : (env.RABBITMQ_URL ?? "amqp://lframework:lframework@localhost:5672");
  const jwtSecret = env.JWT_SECRET ?? (isProduction ? "" : "dev-secret-min-32-chars-for-jwt-signing");
  const baseUrl = env.BASE_URL ?? `http://localhost:${port}`;
  const retentionSweepIntervalRaw = parseInt(env.COMPLIANCE_RETENTION_SWEEP_INTERVAL_MS ?? "3600000", 10);
  const retentionSweepIntervalMs =
    Number.isInteger(retentionSweepIntervalRaw) && retentionSweepIntervalRaw > 0
      ? retentionSweepIntervalRaw
      : 3600000;
  const retentionMinDaysRaw = parseInt(env.COMPLIANCE_RETENTION_MIN_DAYS ?? "1825", 10);
  const retentionMinDays =
    Number.isInteger(retentionMinDaysRaw) && retentionMinDaysRaw >= 1825
      ? retentionMinDaysRaw
      : 1825;
  const retentionBatchSizeRaw = parseInt(env.COMPLIANCE_RETENTION_BATCH_SIZE ?? "200", 10);
  const retentionBatchSize =
    Number.isInteger(retentionBatchSizeRaw) && retentionBatchSizeRaw > 0
      ? retentionBatchSizeRaw
      : 200;
  const retentionScopeStatusesRaw = env.COMPLIANCE_RETENTION_SCOPE_STATUSES ?? "resolvida,dispensada";
  const allowedStatuses = new Set<"resolvida" | "dispensada">(["resolvida", "dispensada"]);
  const retentionScopeStatuses = retentionScopeStatusesRaw
    .split(",")
    .map((status) => status.trim())
    .filter((status): status is "resolvida" | "dispensada" => allowedStatuses.has(status as "resolvida" | "dispensada"));
  const normalizedRetentionScopeStatuses: Array<"resolvida" | "dispensada"> = retentionScopeStatuses.length
    ? retentionScopeStatuses
    : ["resolvida", "dispensada"];

  return {
    port,
    databaseUrl,
    redisUrl,
    rabbitmqUrl,
    jwtSecret,
    baseUrl,
    corsOrigin: env.CORS_ORIGIN,
    retentionSweepIntervalMs,
    retentionMinDays,
    retentionBatchSize,
    retentionScopeStatuses: normalizedRetentionScopeStatuses,
  };
}

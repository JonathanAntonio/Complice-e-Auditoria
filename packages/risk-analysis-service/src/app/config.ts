import { logger } from "@lframework/shared";

export interface RiskServiceConfig {
  port: number;
  baseUrl: string;
  corsOrigin?: string;
}

export function loadRiskServiceConfig(env: NodeJS.ProcessEnv): RiskServiceConfig {
  const port = parseInt(env.RISK_SERVICE_PORT ?? "3006", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    logger.error("RISK_SERVICE_PORT must be a valid port (1-65535)");
    process.exit(1);
  }

  return {
    port,
    baseUrl: env.RISK_BASE_URL ?? `http://localhost:${port}`,
    corsOrigin: env.CORS_ORIGIN,
  };
}

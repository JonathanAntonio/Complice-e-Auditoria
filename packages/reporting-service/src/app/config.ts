import { logger } from "@lframework/shared";

export interface ReportingServiceConfig {
  port: number;
  baseUrl: string;
  corsOrigin?: string;
}

export function loadReportingServiceConfig(env: NodeJS.ProcessEnv): ReportingServiceConfig {
  const port = parseInt(env.REPORTING_SERVICE_PORT ?? "3007", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    logger.error("REPORTING_SERVICE_PORT must be a valid port (1-65535)");
    process.exit(1);
  }

  return {
    port,
    baseUrl: env.REPORTING_BASE_URL ?? `http://localhost:${port}`,
    corsOrigin: env.CORS_ORIGIN,
  };
}

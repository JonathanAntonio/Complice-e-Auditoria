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
import { createApp } from "./app";
import { loadReportingServiceConfig } from "./app/config";
import { ExportJobsService } from "./application/export-jobs.service";
import { createReportingRoutes } from "./adapters/driving/http/routes";

const config = loadReportingServiceConfig(process.env);
const auditFailClosed = process.env.AUDIT_FAIL_CLOSED === "true";

// Inicializa auditoria centralizada via HTTP
const auditServiceUrl = process.env.AUDIT_SERVICE_URL || "http://localhost:3005";
const publisher = new HttpAuditPublisher(auditServiceUrl, {
  failClosed: auditFailClosed,
  onUnavailable: (error) => {
    baseLogger.fatal({ err: error }, "Audit service unavailable (fail-closed enabled). Stopping reporting-service.");
    process.exit(1);
  },
});
const auditLogger = wrapWithAudit(baseLogger, publisher, "reporting-service");
setLogger(auditLogger);

async function bootstrap(): Promise<void> {
  if (auditFailClosed) {
    await publisher.assertAvailable();
  }

  const service = new ExportJobsService();
  const routes = createReportingRoutes(service);
  const app = createApp({ routes }, { baseUrl: config.baseUrl, corsOrigin: config.corsOrigin });

  app.listen(config.port, () => {
    logger.info({ auditFailClosed }, `Reporting service listening on http://localhost:${config.port}`);
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, "Failed to start reporting-service");
  process.exit(1);
});

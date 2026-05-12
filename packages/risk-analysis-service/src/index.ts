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
import { loadRiskServiceConfig } from "./app/config";
import { createApp } from "./app";
import { RiskScoreService } from "./application/risk-score.service";
import { createRiskRoutes } from "./adapters/driving/http/routes";

const config = loadRiskServiceConfig(process.env);

// Inicializa auditoria centralizada via HTTP
const auditServiceUrl = process.env.AUDIT_SERVICE_URL || "http://localhost:3005";
const publisher = new HttpAuditPublisher(auditServiceUrl);
const auditLogger = wrapWithAudit(baseLogger, publisher, "risk-analysis-service");
setLogger(auditLogger);

const service = new RiskScoreService();
const routes = createRiskRoutes(service);
const app = createApp({ routes }, { baseUrl: config.baseUrl, corsOrigin: config.corsOrigin });

app.listen(config.port, () => {
  logger.info(`Risk analysis service listening on http://localhost:${config.port}`);
});

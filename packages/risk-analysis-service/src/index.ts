import path from "path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { logger } from "@lframework/shared";
import { loadRiskServiceConfig } from "./app/config";
import { createApp } from "./app";
import { RiskScoreService } from "./application/risk-score.service";
import { createRiskRoutes } from "./adapters/driving/http/routes";

const config = loadRiskServiceConfig(process.env);
const service = new RiskScoreService();
const routes = createRiskRoutes(service);
const app = createApp({ routes }, { baseUrl: config.baseUrl, corsOrigin: config.corsOrigin });

app.listen(config.port, () => {
  logger.info(`Risk analysis service listening on http://localhost:${config.port}`);
});

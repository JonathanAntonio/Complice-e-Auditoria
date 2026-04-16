import path from "path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), "../../.env"), override: true });

import { logger } from "@lframework/shared";
import { createApp } from "./app";
import { loadReportingServiceConfig } from "./app/config";
import { ExportJobsService } from "./application/export-jobs.service";
import { createReportingRoutes } from "./adapters/driving/http/routes";

const config = loadReportingServiceConfig(process.env);
const service = new ExportJobsService();
const routes = createReportingRoutes(service);
const app = createApp({ routes }, { baseUrl: config.baseUrl, corsOrigin: config.corsOrigin });

app.listen(config.port, () => {
  logger.info(`Reporting service listening on http://localhost:${config.port}`);
});

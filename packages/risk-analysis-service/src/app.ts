import express, { type Express, type Router } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import {
  requestIdMiddleware,
  correlationIdMiddleware,
  requestLoggingMiddleware,
  createErrorHandlerMiddleware,
  createHealthHandler,
  createServiceMetrics,
} from "@lframework/shared";
import { createRiskOpenApi } from "./openapi";

export interface RiskAppContainer {
  routes: Router;
}

export interface CreateRiskAppOptions {
  corsOrigin?: string;
  baseUrl?: string;
}

export function createApp(container: RiskAppContainer, options: CreateRiskAppOptions = {}): Express {
  const app = express();
  const metrics = createServiceMetrics("risk-analysis-service");
  app.set("trust proxy", 1);
  app.use(requestIdMiddleware);
  app.use(correlationIdMiddleware);
  app.use(requestLoggingMiddleware);
  app.use(metrics.middleware);

  if (options.corsOrigin) {
    app.use(cors({ origin: options.corsOrigin.split(",").map((s) => s.trim()), credentials: true }));
  }

  app.use(express.json({ limit: "256kb" }));

  if (options.baseUrl) {
    const openApi = createRiskOpenApi(options.baseUrl);
    app.get("/api-docs.json", (_req, res) => res.json(openApi));
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApi, { customSiteTitle: "Risk Analysis API" }));
  }

  app.use("/api/v1", container.routes);
  app.get("/metrics", metrics.handler);
  app.get("/health", createHealthHandler("risk-analysis-service"));
  app.use(createErrorHandlerMiddleware());

  return app;
}

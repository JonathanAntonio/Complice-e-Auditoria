import express, { type Express, type Router } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { createIntegrationOpenApi } from "./openapi";
import {
  requestIdMiddleware,
  correlationIdMiddleware,
  requestLoggingMiddleware,
  createErrorHandlerMiddleware,
  createHealthHandler,
} from "@lframework/shared";
import { mapIntegrationErrorToHttp } from "./adapters/driving/http/error-to-http.mapper";
import type { MetricsController } from "./adapters/driving/http/metrics.controller";

export interface IntegrationAppContainer {
  integrationRoutes: Router;
  metricsController: MetricsController;
}

export interface CreateAppOptions {
  corsOrigin?: string;
  baseUrl?: string;
}

export function createApp(
  container: IntegrationAppContainer,
  options: CreateAppOptions = {}
): Express {
  const app = express();
  app.set("trust proxy", 1);
  app.use(requestIdMiddleware);
  app.use(correlationIdMiddleware);
  app.use(requestLoggingMiddleware);

  if (options.corsOrigin) {
    app.use(
      cors({
        origin: options.corsOrigin.split(",").map((s) => s.trim()),
        credentials: true,
      })
    );
  }

  app.use(express.json({ limit: "512kb" }));

  if (options.baseUrl) {
    const openApiSpec = createIntegrationOpenApi(options.baseUrl);
    app.get("/api-docs.json", (_req, res) => res.json(openApiSpec));
    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(openApiSpec, { customSiteTitle: "Integration Service API" })
    );
  }

  app.use("/api", container.integrationRoutes);
  app.use("/api/v1", container.integrationRoutes);
  app.get("/metrics", container.metricsController.get);
  app.get("/health", createHealthHandler("integration-service"));
  app.use(createErrorHandlerMiddleware(mapIntegrationErrorToHttp));

  return app;
}

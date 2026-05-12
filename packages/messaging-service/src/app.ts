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
import { createMessagingOpenApi } from "./openapi";

export interface MessagingAppContainer {
  routes: Router;
}

export interface CreateMessagingAppOptions {
  corsOrigin?: string;
  baseUrl?: string;
}

export function createApp(
  container: MessagingAppContainer,
  options: CreateMessagingAppOptions = {},
): Express {
  const app = express();
  const metrics = createServiceMetrics("messaging-service");

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
    const openApi = createMessagingOpenApi(options.baseUrl);
    app.get("/api-docs.json", (_req, res) => res.json(openApi));
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApi, { customSiteTitle: "Messaging Service API" }));
  }

  app.use("/api/v1", container.routes);
  app.get("/metrics", metrics.handler);
  app.get("/health", createHealthHandler("messaging-service"));
  app.use(createErrorHandlerMiddleware());

  return app;
}

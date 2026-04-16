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
  type HttpErrorMapping,
  type ServiceMetrics,
} from "@lframework/shared";
import { createAuditOpenApi } from "./openapi";

export interface AuditAppContainer {
  auditRoutes: Router;
  mapAuditErrorToHttp: (error: unknown) => { statusCode: number; message: string } | null;
}

export interface CreateAuditAppOptions {
  corsOrigin?: string;
  baseUrl?: string;
  onMetricsReady?: (metrics: ServiceMetrics) => void;
}

export function createApp(container: AuditAppContainer, options: CreateAuditAppOptions = {}): Express {
  const app = express();
  const metrics = createServiceMetrics("audit-service");
  options.onMetricsReady?.(metrics);
  app.set("trust proxy", 1);
  app.use(requestIdMiddleware);
  app.use(correlationIdMiddleware);
  app.use(requestLoggingMiddleware);
  app.use(metrics.middleware);

  if (options.corsOrigin) {
    const origins = options.corsOrigin.split(",").map((value) => value.trim()).filter(Boolean);
    app.use(cors({ origin: origins, credentials: true }));
  }

  app.use(express.json({ limit: "256kb" }));

  if (options.baseUrl) {
    const openApi = createAuditOpenApi(options.baseUrl);
    app.get("/api-docs.json", (_req, res) => res.json(openApi));
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApi, { customSiteTitle: "Audit Service API" }));
  }

  app.use("/api", container.auditRoutes);
  app.use("/api/v1", container.auditRoutes);
  app.get("/metrics", metrics.handler);
  app.get("/health", createHealthHandler("audit-service"));

  const errorMapper = (err: unknown): HttpErrorMapping =>
    container.mapAuditErrorToHttp(err) ?? {
      statusCode: 500,
      message: "Internal server error",
    };
  app.use(createErrorHandlerMiddleware(errorMapper));

  return app;
}

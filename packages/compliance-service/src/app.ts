import express, { type Express, type Router } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { createComplianceOpenApi } from "./openapi";
import {
  requestIdMiddleware,
  correlationIdMiddleware,
  requestLoggingMiddleware,
  createErrorHandlerMiddleware,
  createHealthHandler,
  createServiceMetrics,
} from "@lframework/shared";
import type { HttpErrorMapping } from "@lframework/shared";
import type { ServiceMetrics } from "@lframework/shared";

export interface ComplianceAppContainer {
  itemRoutes: Router;
  mapApplicationErrorToHttp: (error: unknown) => { statusCode: number; message: string } | null;
}

export interface CreateAppOptions {
  /** When set, enables CORS with the given origin(s). */
  corsOrigin?: string;
  /** When set, enables API docs and OpenAPI spec at /api-docs and /api-docs.json. */
  baseUrl?: string;
  onMetricsReady?: (metrics: ServiceMetrics) => void;
}

/**
 * Builds the Express application without listening.
 * Used by the server entry point and by integration tests (supertest).
 */
export function createApp(
  container: ComplianceAppContainer,
  options: CreateAppOptions = {}
): Express {
  const app = express();
  const metrics = createServiceMetrics("compliance-service");
  options.onMetricsReady?.(metrics);
  app.use(requestIdMiddleware);
  app.use(correlationIdMiddleware);
  app.use(requestLoggingMiddleware);
  app.use(metrics.middleware);

  if (options.corsOrigin) {
    const origins = options.corsOrigin.split(",").map((s) => s.trim()).filter(Boolean);
    const isWildcard = origins.length === 1 && origins[0] === "*";
    if (isWildcard) {
      app.use(cors({ origin: "*" }));
    } else {
      app.use(cors({ origin: origins, credentials: true }));
    }
  }
  app.use(express.json({ limit: "512kb" }));

  if (options.baseUrl) {
    const openApiSpec = createComplianceOpenApi(options.baseUrl);
    app.get("/api-docs.json", (_req, res) => res.json(openApiSpec));
    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(openApiSpec, { customSiteTitle: "Compliance Service API" })
    );
  }

  app.use("/api", container.itemRoutes);
  app.use("/api/v1", container.itemRoutes);

  app.get("/metrics", metrics.handler);
  app.get("/health", createHealthHandler("compliance-service"));

  const errorMapper = (err: unknown): HttpErrorMapping =>
    container.mapApplicationErrorToHttp(err) ?? {
      statusCode: 500,
      message: "Internal server error",
    };
  app.use(createErrorHandlerMiddleware(errorMapper));

  return app;
}

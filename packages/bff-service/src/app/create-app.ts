import express from "express";
import {
  correlationIdMiddleware,
  requestIdMiddleware,
  requestLoggingMiddleware,
} from "@lframework/shared";
import type { BffConfig } from "./config";
import { IamAuthHttpClient } from "../adapters/driven/http/iam-auth-http.client";
import { ComplianceHttpClient } from "../adapters/driven/http/compliance-http.client";
import { AuditHttpClient } from "../adapters/driven/http/audit-http.client";
import { CookieSessionService } from "../adapters/driving/http/cookie-session.service";
import { StartOAuthUseCase } from "../application/use-cases/start-oauth.use-case";
import { CompleteOAuthCallbackUseCase } from "../application/use-cases/complete-oauth-callback.use-case";
import { GetCurrentUserUseCase } from "../application/use-cases/get-current-user.use-case";
import { LogoutUseCase } from "../application/use-cases/logout.use-case";
import { CreateComplianceViolationUseCase } from "../application/use-cases/create-compliance-violation.use-case";
import { ListComplianceViolationsUseCase } from "../application/use-cases/list-compliance-violations.use-case";
import { UpdateComplianceViolationUseCase } from "../application/use-cases/update-compliance-violation.use-case";
import { ListAuditLogsUseCase } from "../application/use-cases/list-audit-logs.use-case";
import { AuthHandlers } from "../adapters/driving/http/auth.handlers";

export function createApp(config: BffConfig) {
  const app = express();
  app.set("trust proxy", 1);
  app.use(requestIdMiddleware);
  app.use(correlationIdMiddleware);
  app.use(requestLoggingMiddleware);
  app.use(express.json({ limit: "128kb" }));

  const iamAuthClient = new IamAuthHttpClient({
    gatewayBaseUrl: config.gatewayBaseUrl,
    iamAuthBasePath: config.iamAuthBasePath,
  });
  const complianceHttpClient = new ComplianceHttpClient({
    gatewayBaseUrl: config.gatewayBaseUrl,
    complianceBasePath: config.complianceBasePath,
  });
  const auditHttpClient = new AuditHttpClient({
    gatewayBaseUrl: config.gatewayBaseUrl,
    auditBasePath: config.auditBasePath,
  });
  const cookieSessionService = new CookieSessionService({
    sessionCookieName: config.sessionCookieName,
    sessionMaxAgeSeconds: config.sessionMaxAgeSeconds,
  });

  const handlers = new AuthHandlers({
    startOAuthUseCase: new StartOAuthUseCase(iamAuthClient),
    completeOAuthCallbackUseCase: new CompleteOAuthCallbackUseCase(iamAuthClient),
    getCurrentUserUseCase: new GetCurrentUserUseCase(iamAuthClient),
    logoutUseCase: new LogoutUseCase(iamAuthClient),
    createComplianceViolationUseCase: new CreateComplianceViolationUseCase(complianceHttpClient),
    updateComplianceViolationUseCase: new UpdateComplianceViolationUseCase(complianceHttpClient),
    listComplianceViolationsUseCase: new ListComplianceViolationsUseCase(complianceHttpClient),
    listAuditLogsUseCase: new ListAuditLogsUseCase(auditHttpClient),
    cookieSessionService,
    explicitPublicBaseUrl: config.explicitPublicBaseUrl,
  });

  app.get("/health", handlers.health);
  app.get("/bff/auth/google/start", handlers.googleStart);
  app.get("/bff/auth/github/start", handlers.githubStart);
  app.get("/bff/auth/google/callback", handlers.googleCallback);
  app.get("/bff/auth/github/callback", handlers.githubCallback);
  app.get("/bff/auth/me", handlers.me);
  app.post("/bff/auth/logout", handlers.logout);
  app.get("/bff/compliance/violations", handlers.listComplianceViolations);
  app.post("/bff/compliance/violations", handlers.createComplianceViolation);
  app.patch("/bff/compliance/violations/:violationId", handlers.updateComplianceViolation);
  app.get("/bff/audit/logs", handlers.listAuditLogs);

  return app;
}

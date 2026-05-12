import express from "express";
import {
  correlationIdMiddleware,
  requestIdMiddleware,
  requestLoggingMiddleware,
  createServiceMetrics,
} from "@lframework/shared";
import type { BffConfig } from "./config";
import { IamAuthHttpClient } from "../adapters/driven/http/iam-auth-http.client";
import { ComplianceHttpClient } from "../adapters/driven/http/compliance-http.client";
import { AuditHttpClient } from "../adapters/driven/http/audit-http.client";
import { RiskHttpClient } from "../adapters/driven/http/risk-http.client";
import { ReportingHttpClient } from "../adapters/driven/http/reporting-http.client";
import { NotificationHttpClient } from "../adapters/driven/http/notification-http.client";
import { IntegrationAuditHttpClient } from "../adapters/driven/http/integration-audit-http.client";
import { CookieSessionService } from "../adapters/driving/http/cookie-session.service";
import {
  CompleteOAuthCallbackUseCase,
  CreateAdminUserUseCase,
  CreateComplianceViolationUseCase,
  CreateReportExportUseCase,
  DeactivateAdminUserUseCase,
  DispatchNotificationUseCase,
  DownloadReportExportUseCase,
  GetAdminUserUseCase,
  GetCurrentUserUseCase,
  GetReportExportUseCase,
  GetRiskScoreHistoryUseCase,
  IngestFrontendAuditLogUseCase,
  IngestRiskEventUseCase,
  ListAdminUsersUseCase,
  ListAuditLogsUseCase,
  ListAuditRetentionRunsUseCase,
  ListComplianceRetentionRunsUseCase,
  ListComplianceViolationsUseCase,
  ListNotificationLogsUseCase,
  ListRiskScoresUseCase,
  LoginUseCase,
  LogoutUseCase,
  PublishIntegrationEventUseCase,
  RegisterUseCase,
  StartOAuthUseCase,
  UpdateAdminUserRolesUseCase,
  UpdateAdminUserSecurityUseCase,
  UpdateComplianceViolationUseCase,
} from "../application/use-cases";
import { AuthHandlers } from "../adapters/driving/http/auth.handlers";

export function createApp(config: BffConfig) {
  const app = express();
  const metrics = createServiceMetrics("bff-service");
  app.set("trust proxy", 1);
  app.use(requestIdMiddleware);
  app.use(correlationIdMiddleware);
  app.use(requestLoggingMiddleware);
  app.use(metrics.middleware);
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
  const riskHttpClient = new RiskHttpClient({
    gatewayBaseUrl: config.gatewayBaseUrl,
    riskBasePath: config.riskBasePath,
  });
  const reportingHttpClient = new ReportingHttpClient({
    gatewayBaseUrl: config.gatewayBaseUrl,
    reportingBasePath: config.reportingBasePath,
  });
  const notificationHttpClient = new NotificationHttpClient({
    gatewayBaseUrl: config.gatewayBaseUrl,
    notificationBasePath: config.notificationBasePath,
  });
  const integrationAuditHttpClient = new IntegrationAuditHttpClient({
    gatewayBaseUrl: config.gatewayBaseUrl,
    integrationBasePath: config.integrationBasePath,
    integrationApiKey: config.integrationApiKey,
  });
  const cookieSessionService = new CookieSessionService({
    sessionCookieName: config.sessionCookieName,
    sessionMaxAgeSeconds: config.sessionMaxAgeSeconds,
  });

  const handlers = new AuthHandlers({
    loginUseCase: new LoginUseCase(iamAuthClient),
    registerUseCase: new RegisterUseCase(iamAuthClient),
    startOAuthUseCase: new StartOAuthUseCase(iamAuthClient),
    completeOAuthCallbackUseCase: new CompleteOAuthCallbackUseCase(iamAuthClient),
    getCurrentUserUseCase: new GetCurrentUserUseCase(iamAuthClient),
    logoutUseCase: new LogoutUseCase(iamAuthClient),
    createComplianceViolationUseCase: new CreateComplianceViolationUseCase(complianceHttpClient),
    updateComplianceViolationUseCase: new UpdateComplianceViolationUseCase(complianceHttpClient),
    listComplianceViolationsUseCase: new ListComplianceViolationsUseCase(complianceHttpClient),
    listAuditLogsUseCase: new ListAuditLogsUseCase(auditHttpClient),
    listAuditRetentionRunsUseCase: new ListAuditRetentionRunsUseCase(auditHttpClient),
    listComplianceRetentionRunsUseCase: new ListComplianceRetentionRunsUseCase(complianceHttpClient),
    listRiskScoresUseCase: new ListRiskScoresUseCase(riskHttpClient),
    getRiskScoreHistoryUseCase: new GetRiskScoreHistoryUseCase(riskHttpClient),
    ingestRiskEventUseCase: new IngestRiskEventUseCase(riskHttpClient),
    createReportExportUseCase: new CreateReportExportUseCase(reportingHttpClient),
    getReportExportUseCase: new GetReportExportUseCase(reportingHttpClient),
    downloadReportExportUseCase: new DownloadReportExportUseCase(reportingHttpClient),
    dispatchNotificationUseCase: new DispatchNotificationUseCase(notificationHttpClient),
    listNotificationLogsUseCase: new ListNotificationLogsUseCase(notificationHttpClient),
    listAdminUsersUseCase: new ListAdminUsersUseCase(iamAuthClient),
    getAdminUserUseCase: new GetAdminUserUseCase(iamAuthClient),
    createAdminUserUseCase: new CreateAdminUserUseCase(iamAuthClient),
    updateAdminUserRolesUseCase: new UpdateAdminUserRolesUseCase(iamAuthClient),
    updateAdminUserSecurityUseCase: new UpdateAdminUserSecurityUseCase(iamAuthClient),
    deactivateAdminUserUseCase: new DeactivateAdminUserUseCase(iamAuthClient),
    publishIntegrationEventUseCase: new PublishIntegrationEventUseCase(integrationAuditHttpClient),
    ingestFrontendAuditLogUseCase: new IngestFrontendAuditLogUseCase(auditHttpClient),
    integrationAuditPublisher: integrationAuditHttpClient,
    cookieSessionService,
    explicitPublicBaseUrl: config.explicitPublicBaseUrl,
  });

  app.get("/health", handlers.health);
  app.get("/metrics", metrics.handler);

  // Public routes (frontend-facing)
  app.post("/auth/login", handlers.login);
  app.post("/auth/register", handlers.register);
  app.get("/auth/google/start", handlers.googleStart);
  app.get("/auth/github/start", handlers.githubStart);
  app.get("/auth/google/exchange", handlers.googleExchange);
  app.get("/auth/github/exchange", handlers.githubExchange);
  app.post("/auth/google/exchange", handlers.googleExchange);
  app.post("/auth/github/exchange", handlers.githubExchange);
  app.get("/auth/me", handlers.me);
  app.post("/auth/logout", handlers.logout);
  app.get("/compliance/violations", handlers.listComplianceViolations);
  app.post("/compliance/violations", handlers.createComplianceViolation);
  app.patch("/compliance/violations/:violationId", handlers.updateComplianceViolation);
  app.get("/audit/logs", handlers.listAuditLogs);
  app.post("/audit/logs", handlers.ingestFrontendAuditLog);
  app.get("/audit/retention/runs", handlers.listAuditRetentionRuns);
  app.get("/compliance/retention/runs", handlers.listComplianceRetentionRuns);
  app.get("/risk/scores", handlers.listRiskScores);
  app.get("/risk/scores/:entityType/:entityId/history", handlers.getRiskScoreHistory);
  app.post("/risk/events", handlers.ingestRiskEvent);
  app.post("/reports/exports", handlers.createReportExport);
  app.get("/reports/exports/:id", handlers.getReportExport);
  app.get("/reports/exports/:id/download", handlers.downloadReportExport);
  app.post("/notifications/dispatch", handlers.dispatchNotification);
  app.get("/notifications/logs", handlers.listNotificationLogs);
  app.get("/admin/users", handlers.listAdminUsers);
  app.get("/admin/users/:userId", handlers.getAdminUser);
  app.post("/admin/users", handlers.createAdminUser);
  app.put("/admin/users/:userId/roles", handlers.updateAdminUserRoles);
  app.patch("/admin/users/:userId/security", handlers.updateAdminUserSecurity);
  app.delete("/admin/users/:userId", handlers.deactivateAdminUser);
  app.post("/integrations/events", handlers.publishIntegrationEvent);

  return app;
}

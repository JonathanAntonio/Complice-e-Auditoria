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
import { StartOAuthUseCase } from "../application/use-cases/start-oauth.use-case";
import { CompleteOAuthCallbackUseCase } from "../application/use-cases/complete-oauth-callback.use-case";
import { GetCurrentUserUseCase } from "../application/use-cases/get-current-user.use-case";
import { LogoutUseCase } from "../application/use-cases/logout.use-case";
import { CreateComplianceViolationUseCase } from "../application/use-cases/create-compliance-violation.use-case";
import { ListComplianceViolationsUseCase } from "../application/use-cases/list-compliance-violations.use-case";
import { UpdateComplianceViolationUseCase } from "../application/use-cases/update-compliance-violation.use-case";
import { ListAuditLogsUseCase } from "../application/use-cases/list-audit-logs.use-case";
import { ListAuditRetentionRunsUseCase } from "../application/use-cases/list-audit-retention-runs.use-case";
import { ListComplianceRetentionRunsUseCase } from "../application/use-cases/list-compliance-retention-runs.use-case";
import { ListRiskScoresUseCase } from "../application/use-cases/list-risk-scores.use-case";
import { GetRiskScoreHistoryUseCase } from "../application/use-cases/get-risk-score-history.use-case";
import { IngestRiskEventUseCase } from "../application/use-cases/ingest-risk-event.use-case";
import { CreateReportExportUseCase } from "../application/use-cases/create-report-export.use-case";
import { GetReportExportUseCase } from "../application/use-cases/get-report-export.use-case";
import { DownloadReportExportUseCase } from "../application/use-cases/download-report-export.use-case";
import { DispatchNotificationUseCase } from "../application/use-cases/dispatch-notification.use-case";
import { ListNotificationLogsUseCase } from "../application/use-cases/list-notification-logs.use-case";
import { ListAdminUsersUseCase } from "../application/use-cases/list-admin-users.use-case";
import { GetAdminUserUseCase } from "../application/use-cases/get-admin-user.use-case";
import { CreateAdminUserUseCase } from "../application/use-cases/create-admin-user.use-case";
import { UpdateAdminUserRolesUseCase } from "../application/use-cases/update-admin-user-roles.use-case";
import { UpdateAdminUserSecurityUseCase } from "../application/use-cases/update-admin-user-security.use-case";
import { DeactivateAdminUserUseCase } from "../application/use-cases/deactivate-admin-user.use-case";
import { PublishIntegrationEventUseCase } from "../application/use-cases/publish-integration-event.use-case";
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
    integrationAuditPublisher: integrationAuditHttpClient,
    cookieSessionService,
    explicitPublicBaseUrl: config.explicitPublicBaseUrl,
  });

  app.get("/health", handlers.health);
  app.get("/metrics", metrics.handler);

  // Public routes (frontend-facing)
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

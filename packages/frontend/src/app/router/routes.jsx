import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "../layout/app-shell";
import { PermissionGuard } from "../layout/permission-guard";
import { OverviewPage } from "../../features/overview/pages/overview-page";
import { CompliancePage } from "../../features/compliance/pages/compliance-page";
import { AuditPage } from "../../features/audit/pages/audit-page";
import { RiskPage } from "../../features/risk/pages/risk-page";
import { ReportingPage } from "../../features/reporting/pages/reporting-page";
import { RetentionPage } from "../../features/retention/pages/retention-page";
import { NotificationsPage } from "../../features/notifications/pages/notifications-page";
import { IntegrationsPage } from "../../features/integrations/pages/integrations-page";
import { AdminPage } from "../../features/admin/pages/admin-page";
import { TeamsPage } from "../../features/teams/pages/teams-page";
import { OAuthCallbackPage } from "../../features/auth/pages/oauth-callback-page";
import { MessagingFlowPage } from "../../features/messaging/pages/messaging-flow-page";
import { HealthPage } from "../../features/health/pages/health-page";
import { ComplianceSlaPage } from "../../features/compliance/pages/compliance-sla-page";

const withPermission = (requiredAny, element) => (
  <PermissionGuard requiredAny={requiredAny}>{element}</PermissionGuard>
);

export const router = createBrowserRouter([
  {
    path: "/login/google/callback",
    element: <OAuthCallbackPage provider="google" />,
  },
  {
    path: "/login/github/callback",
    element: <OAuthCallbackPage provider="github" />,
  },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: "compliance", element: withPermission(["compliance.violations.read"], <CompliancePage />) },
      { path: "compliance/sla", element: withPermission(["compliance.violations.read"], <ComplianceSlaPage />) },
      { path: "audit", element: withPermission(["audit.logs.read.any", "audit.logs.read.scoped"], <AuditPage />) },
      { path: "risk", element: withPermission(["risk.scores.read"], <RiskPage />) },
      { path: "reports", element: withPermission(["reports.read", "reports.export"], <ReportingPage />) },
      { path: "retention", element: withPermission(["audit.logs.read.any", "audit.logs.read.scoped", "compliance.violations.read"], <RetentionPage />) },
      { path: "notifications", element: withPermission(["reports.read", "reports.export", "system.settings.manage"], <NotificationsPage />) },
      { path: "integrations", element: withPermission(["system.settings.manage"], <IntegrationsPage />) },
      { path: "messaging", element: withPermission(["audit.logs.read.any", "audit.logs.read.scoped", "reports.read", "reports.export", "system.settings.manage"], <MessagingFlowPage />) },
      { path: "admin", element: withPermission(["users.read.any", "users.create", "roles.assign", "users.update", "users.deactivate", "system.settings.manage"], <AdminPage />) },
      { path: "teams", element: <TeamsPage /> },
      { path: "health", element: <HealthPage /> },
      { path: "operations", element: <Navigate to="/reports" replace /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

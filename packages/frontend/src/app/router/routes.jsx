import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "../layout/app-shell";
import { PermissionGuard } from "../layout/permission-guard";
import { OverviewPage } from "../../features/overview/pages/overview-page";
import { CompliancePage } from "../../features/compliance/pages/compliance-page";
import { AuditPage } from "../../features/audit/pages/audit-page";
import { RiskPage } from "../../features/risk/pages/risk-page";
import { GovernancePage } from "../../features/governance/pages/governance-page";
import { AdminPage } from "../../features/admin/pages/admin-page";
import { TeamsPage } from "../../features/teams/pages/teams-page";
import { OAuthCallbackPage } from "../../features/auth/pages/oauth-callback-page";
import { MessagingFlowPage } from "../../features/messaging/pages/messaging-flow-page";
import { HealthPage } from "../../features/health/pages/health-page";

const withPermission = (requiredAny, element) => (
  <PermissionGuard requiredAny={requiredAny}>{element}</PermissionGuard>
);

const GOVERNANCE_ANY_PERMISSIONS = [
  "reports.read",
  "reports.export",
  "system.settings.manage",
  "audit.logs.read.any",
  "audit.logs.read.scoped",
  "compliance.violations.read",
];

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
      { path: "audit", element: withPermission(["audit.logs.read.any", "audit.logs.read.scoped"], <AuditPage />) },
      { path: "operations", element: withPermission(GOVERNANCE_ANY_PERMISSIONS, <GovernancePage />) },
      { path: "retention", element: withPermission(GOVERNANCE_ANY_PERMISSIONS, <GovernancePage />) },
      { path: "risk", element: withPermission(["risk.scores.read"], <RiskPage />) },
      { path: "notifications", element: withPermission(GOVERNANCE_ANY_PERMISSIONS, <GovernancePage />) },
      { path: "integrations", element: withPermission(GOVERNANCE_ANY_PERMISSIONS, <GovernancePage />) },
      { path: "messaging", element: withPermission(["audit.logs.read.any", "audit.logs.read.scoped", "reports.read", "reports.export", "system.settings.manage"], <MessagingFlowPage />) },
      { path: "reports", element: withPermission(GOVERNANCE_ANY_PERMISSIONS, <GovernancePage />) },
      { path: "admin", element: withPermission(["users.read.any", "users.create", "roles.assign", "users.update", "users.deactivate", "system.settings.manage"], <AdminPage />) },
      { path: "teams", element: <TeamsPage /> },
      { path: "health", element: <HealthPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

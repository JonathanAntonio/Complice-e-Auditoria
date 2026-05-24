import { useMemo } from "react";
import { Alert, Card, Space, Tabs } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "../../../shared/ui/page-header";
import { useSession } from "../../auth/context/session-context";
import { ReportingPage } from "../../reporting/pages/reporting-page";
import { RetentionPage } from "../../retention/pages/retention-page";
import { NotificationsPage } from "../../notifications/pages/notifications-page";
import { IntegrationsPage } from "../../integrations/pages/integrations-page";

const TAB_CONFIG = [
  {
    key: "reports",
    label: "Relatórios",
    path: "/reports",
    requiredAny: ["reports.read", "reports.export"],
    render: () => <ReportingPage embedded />,
  },
  {
    key: "retention",
    label: "Retenção",
    path: "/retention",
    requiredAny: ["audit.logs.read.any", "audit.logs.read.scoped", "compliance.violations.read"],
    render: () => <RetentionPage embedded />,
  },
  {
    key: "notifications",
    label: "Notificações",
    path: "/notifications",
    requiredAny: ["reports.read", "reports.export", "system.settings.manage"],
    render: () => <NotificationsPage embedded />,
  },
  {
    key: "integrations",
    label: "Integrações",
    path: "/integrations",
    requiredAny: ["system.settings.manage"],
    render: () => <IntegrationsPage embedded />,
  },
];

const resolveTabByPath = (pathname) => {
  const match = TAB_CONFIG.find((tab) => pathname === tab.path || pathname.startsWith(`${tab.path}/`));
  return match?.key ?? "reports";
};

export function GovernancePage() {
  const { hasAnyPermission } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const tabState = useMemo(
    () =>
      TAB_CONFIG.map((tab) => ({
        ...tab,
        allowed: tab.requiredAny.length === 0 || hasAnyPermission(tab.requiredAny),
      })),
    [hasAnyPermission],
  );

  const enabledTabs = tabState.filter((tab) => tab.allowed);

  if (enabledTabs.length === 0) {
    return (
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <PageHeader
          title="Operações"
          subtitle="Central de governança operacional em uma única área de trabalho."
        />
        <Alert
          type="warning"
          showIcon
          message="Sem módulos disponíveis"
          description="Seu perfil não possui permissões para os módulos de governança."
        />
      </Space>
    );
  }

  const pathTab = resolveTabByPath(pathname);
  const currentTab = tabState.some((tab) => tab.key === pathTab && tab.allowed) ? pathTab : enabledTabs[0].key;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader
        title="Operações"
        subtitle="Relatórios, retenção, notificações e integrações em uma única tela."
      />

      <Card>
        <Tabs
          activeKey={currentTab}
          onChange={(nextTab) => {
            const target = tabState.find((tab) => tab.key === nextTab);
            if (target?.allowed) {
              navigate(target.path);
            }
          }}
          items={tabState.map((tab) => ({
            key: tab.key,
            label: tab.label,
            disabled: !tab.allowed,
            children: tab.allowed ? tab.render() : null,
          }))}
        />
      </Card>
    </Space>
  );
}

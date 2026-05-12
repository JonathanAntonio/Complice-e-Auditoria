import { Avatar, Button, Layout, Menu, Space, Spin, Typography } from "antd";
import { Building2, LogOut, RefreshCw, UserRound } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../../features/auth/context/session-context";
import { LoginPage } from "../../features/auth/pages/login-page";
import {
  filterNavGroupsByPermission,
  resolveNavContext,
} from "../../shared/lib/navigation/nav-utils";

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    session,
    isAuthenticated,
    isLoading,
    isRefreshing,
    refreshSession,
    logout,
    hasAnyPermission,
  } = useSession();

  if (isLoading) {
    return (
      <div className="app-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const navGroups = filterNavGroupsByPermission(hasAnyPermission);
  const menuItems = navGroups.map((group) => ({
    type: "group",
    key: group.key,
    label: <span className="sider-group-title">{group.label}</span>,
    children: group.items.map((item) => {
      const Icon = item.icon;
      return {
        key: item.path,
        icon: <Icon size={16} />,
        label: item.label,
      };
    }),
  }));

  const { selectedKey, sectionTitle, sectionSubtitle, sectionGroup } = resolveNavContext(location.pathname);

  return (
    <Layout className="app-shell">
      <Sider width={240} theme="light" className="app-sider">
        <div className="app-brand">
          <Building2 size={18} />
          <div>
            <div>Complice e Auditoria</div>
            <small>Centro operacional</small>
          </div>
        </div>
        <div className="sider-nav-wrap">
          {menuItems.length > 0 ? (
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
            />
          ) : (
            <div className="sider-empty">
              <Text type="secondary">Nenhum módulo disponível para seu perfil.</Text>
            </div>
          )}
        </div>
      </Sider>
      <Layout>
        <Header className="app-header">
          <div className="topbar-context">
            <Title level={4} className="topbar-title">{sectionTitle}</Title>
            <Text className="topbar-crumb">{sectionGroup} &gt; {sectionTitle}</Text>
            <Text type="secondary" className="topbar-subtitle">{sectionSubtitle}</Text>
          </div>
          <Space size="middle" className="topbar-actions">
            <Button icon={<RefreshCw size={14} />} loading={isRefreshing} onClick={() => void refreshSession()}>Atualizar sessão</Button>
            <div className="session-identity">
              <Avatar size={30} icon={<UserRound size={14} />} className="session-avatar" />
              <div className="session-meta">
                <Text strong className="session-name">{session?.name ?? "Usuário"}</Text>
                <Text type="secondary" className="session-role">{session?.primaryRole ?? "sem role"}</Text>
              </div>
            </div>
            <Button type="text" icon={<LogOut size={14} />} onClick={() => void logout()}>Sair</Button>
          </Space>
        </Header>
        <Content className="app-content">
          <div className="app-content-inner">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Layout,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  Building2,
  Fingerprint,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  clearAuthErrorFromQuery,
  getCurrentUserSession,
  logoutSession,
  readAuthErrorFromQuery,
  startGithubOAuth,
  startGoogleOAuth,
} from "./bff-client";

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const gatewayUrl = window.location.origin;

function statusFromError(error, fallback) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function isUnauthenticatedMessage(message) {
  const normalized = message.toLowerCase();
  return normalized.includes("não autenticado") || normalized.includes("nao autenticado") || normalized.includes("unauthorized");
}

export function App() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("Pronto.");
  const [statusType, setStatusType] = useState("info");
  const [loading, setLoading] = useState(true);

  async function loadSession(showProgressStatus = true) {
    if (showProgressStatus) {
      setStatus("Validando sessão...");
      setStatusType("info");
    }

    setLoading(true);
    try {
      const currentUser = await getCurrentUserSession();
      setUser(currentUser);
      setStatus("Sessão ativa.");
      setStatusType("success");
    } catch (error) {
      const message = statusFromError(error, "Não autenticado.");
      setUser(null);

      if (isUnauthenticatedMessage(message)) {
        if (showProgressStatus) {
          setStatus("Pronto.");
          setStatusType("info");
        }
      } else {
        setStatus(message);
        setStatusType("error");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const { authError, authProvider } = readAuthErrorFromQuery();
    if (authError) {
      const providerLabel = authProvider ? authProvider.toUpperCase() : "OAuth";
      setStatus(`${providerLabel}: ${authError}`);
      setStatusType("error");
      clearAuthErrorFromQuery();
    }

    void loadSession(false);
  }, []);

  async function onRefreshProfile() {
    setStatus("Atualizando perfil...");
    setStatusType("info");
    await loadSession(false);
  }

  async function onLogout() {
    setLoading(true);
    setStatus("Encerrando sessão...");
    setStatusType("info");
    try {
      await logoutSession();
    } catch {
      // limpa sessão local mesmo quando o logout remoto falhar
    } finally {
      setUser(null);
      setStatus("Sessão encerrada.");
      setStatusType("info");
      setLoading(false);
    }
  }

  function onStartGoogleOAuth() {
    setLoading(true);
    setStatus("Redirecionando para Google...");
    setStatusType("info");
    startGoogleOAuth();
  }

  function onStartGithubOAuth() {
    setLoading(true);
    setStatus("Redirecionando para GitHub...");
    setStatusType("info");
    startGithubOAuth();
  }

  const unauthenticatedView = (
    <Row gutter={[20, 20]} className="auth-shell">
      <Col xs={24} lg={14}>
        <Card className="auth-brand-card auth-enter">
          <Space direction="vertical" size={18} style={{ width: "100%" }}>
            <Tag color="blue">IAM Corporativo</Tag>
            <Title level={2} style={{ margin: 0 }}>
              Acesso federado para operações de auditoria
            </Title>
            <Paragraph className="hero-subtitle">
              Entrada única com provedores confiáveis, rastreabilidade de sessão e autorização por papéis.
            </Paragraph>

            <div className="feature-grid">
              <div className="feature-item">
                <Avatar size={30} className="feature-avatar" icon={<ShieldCheck size={16} />} />
                <Text>Políticas de acesso por papéis e permissões.</Text>
              </div>
              <div className="feature-item">
                <Avatar size={30} className="feature-avatar" icon={<Fingerprint size={16} />} />
                <Text>Auditoria de autenticação com trilha de eventos.</Text>
              </div>
              <div className="feature-item">
                <Avatar size={30} className="feature-avatar" icon={<LockKeyhole size={16} />} />
                <Text>Login por OAuth (Google/GitHub), sem senha local.</Text>
              </div>
            </div>
          </Space>
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Card className="auth-form-card auth-enter" title="Entrar na plataforma" extra={<Tag color="cyan">OAuth</Tag>}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {status !== "Pronto." ? (
              <Alert
                type={statusType}
                showIcon
                message={status}
              />
            ) : null}
            <Text className="sso-caption">Escolha o provedor para iniciar sessão no IAM.</Text>
            <Button
              className="oauth-btn oauth-google"
              size="large"
              block
              loading={loading}
              onClick={onStartGoogleOAuth}
            >
              Entrar com Google
            </Button>
            <Button
              className="oauth-btn oauth-github"
              size="large"
              block
              loading={loading}
              onClick={onStartGithubOAuth}
            >
              Entrar com GitHub
            </Button>
            <Divider style={{ margin: "6px 0" }} />
            <Alert
              type="info"
              showIcon
              message="Login federado via BFF com sessão em cookie HttpOnly."
            />
          </Space>
        </Card>
      </Col>
    </Row>
  );

  const authenticatedView = user ? (
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={16}>
        <Card className="hero-card">
          <Title level={2} style={{ marginTop: 0 }}>
            Painel Corporativo de Identidade e Acesso
          </Title>
          <Paragraph className="hero-subtitle">
            Autenticação centralizada via gateway em <code>{gatewayUrl}</code> com sessão mediada pelo BFF.
          </Paragraph>
          <Alert type="info" showIcon message={status} />
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Card title="Acesso da conta" extra={<Tag color="blue">Conta</Tag>}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Alert type="success" showIcon message={`Autenticado como ${user.name}`} description={user.email} />
            <Space wrap>
              <Button icon={<RefreshCw size={16} />} onClick={onRefreshProfile} loading={loading}>
                Atualizar perfil
              </Button>
              <Button danger icon={<LogOut size={16} />} onClick={onLogout} loading={loading}>
                Logout
              </Button>
            </Space>
          </Space>
        </Card>
      </Col>

      <Col xs={24} lg={14}>
        <Card title="Perfil e acessos" extra={<Tag color="green">Ativo</Tag>}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Nome">{user.name}</Descriptions.Item>
            <Descriptions.Item label="E-mail">{user.email}</Descriptions.Item>
            <Descriptions.Item label="Papel principal">{user.primaryRole}</Descriptions.Item>
            <Descriptions.Item label="Roles">
              <Space wrap>
                {(user.roles ?? []).map((role) => (
                  <Tag key={role}>{role}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Permissões">
              <Space wrap>
                {(user.permissions ?? []).map((permission) => (
                  <Tag key={permission} color="cyan">
                    {permission}
                  </Tag>
                ))}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
    </Row>
  ) : null;

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="brand">
          <Building2 size={18} />
          <Text className="brand-text">Complice e Auditoria</Text>
        </div>
      </Header>

      <Content className="app-content">
        {user ? authenticatedView : unauthenticatedView}
      </Content>
    </Layout>
  );
}

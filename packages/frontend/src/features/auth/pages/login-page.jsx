import { useEffect, useState } from "react";
import { Alert, Button, Card, Space, Typography } from "antd";
import {
  clearAuthErrorFromQuery,
  readAuthErrorFromQuery,
  startGithubOAuth,
  startGoogleOAuth,
} from "../../../bff-client";

const { Title, Paragraph } = Typography;

export function LoginPage() {
  const [oauthFeedback, setOauthFeedback] = useState(null);

  useEffect(() => {
    const { authError, authProvider } = readAuthErrorFromQuery();
    if (authError) {
      setOauthFeedback({
        message: authError,
        provider: authProvider ? authProvider.toUpperCase() : null,
      });
      clearAuthErrorFromQuery();
    }
  }, []);

  return (
    <div className="auth-center">
      <Card className="auth-card">
        <Title level={3}>Complice e Auditoria</Title>
        <Paragraph type="secondary">
          Faça login para acessar os workspaces de compliance, auditoria, risco e administração.
        </Paragraph>

        {oauthFeedback ? (
          <Alert
            style={{ marginBottom: 16 }}
            type="error"
            showIcon
            message={`Falha no login${oauthFeedback.provider ? ` (${oauthFeedback.provider})` : ""}`}
            description={oauthFeedback.message}
          />
        ) : null}

        <Space direction="vertical" style={{ width: "100%" }}>
          <Button block onClick={startGoogleOAuth}>Entrar com Google</Button>
          <Button block type="primary" onClick={startGithubOAuth}>Entrar com GitHub</Button>
        </Space>
      </Card>
    </div>
  );
}

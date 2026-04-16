import { useEffect } from "react";
import { Card, Spin, Typography } from "antd";
import { completeOAuthCallback } from "../../../bff-client";

const { Title, Paragraph } = Typography;

function redirectToLoginError(provider, message) {
  const query = new URLSearchParams({
    auth_error: message,
    auth_provider: provider,
  });
  window.location.replace(`/?${query.toString()}`);
}

export function OAuthCallbackPage({ provider }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code") ?? "";
    const state = params.get("state") ?? "";

    if (!code || !state) {
      redirectToLoginError(provider, "Missing code/state on OAuth callback");
      return;
    }

    void completeOAuthCallback(provider, code, state)
      .then(() => {
        window.location.replace("/");
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "OAuth callback failed";
        redirectToLoginError(provider, message);
      });
  }, [provider]);

  return (
    <div className="auth-center">
      <Card className="auth-card">
        <Title level={4}>Concluindo login</Title>
        <Paragraph type="secondary">Aguarde enquanto finalizamos sua autenticação com {provider}.</Paragraph>
        <Spin />
      </Card>
    </div>
  );
}

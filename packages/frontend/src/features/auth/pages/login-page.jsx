import { useEffect, useState } from "react";
import { Alert, Button, Card, Divider, Form, Input, Space, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import {
  clearAuthErrorFromQuery,
  readAuthErrorFromQuery,
  startGithubOAuth,
  startGoogleOAuth,
  login,
  register,
} from "../../../bff-client";

const { Title, Paragraph, Text } = Typography;

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
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

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (isRegister) {
        await register(values.email, values.password, values.name);
        message.success("Conta criada com sucesso!");
      } else {
        await login(values.email, values.password);
        message.success("Bem-vindo de volta!");
      }
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      message.error(err.message || "Erro ao autenticar. Verifique seus dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-center">
      <Card className="auth-card">
        <Title level={3}>Complice e Auditoria</Title>
        <Paragraph type="secondary">
          {isRegister
            ? "Crie sua conta para começar a gerenciar compliance e auditoria."
            : "Faça login para acessar os workspaces de compliance, auditoria, risco e administração."}
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

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          {isRegister && (
            <Form.Item
              label="Nome"
              name="name"
              rules={[{ required: true, message: "Por favor, insira seu nome" }]}
            >
              <Input placeholder="Seu nome completo" />
            </Form.Item>
          )}
          <Form.Item
            label="E-mail"
            name="email"
            rules={[
              { required: true, message: "Por favor, insira seu e-mail" },
              { type: "email", message: "E-mail inválido" },
            ]}
          >
            <Input placeholder="seu@email.com" />
          </Form.Item>
          <Form.Item
            label="Senha"
            name="password"
            rules={[
              { required: true, message: "Por favor, insira sua senha" },
              { min: isRegister ? 8 : 1, message: isRegister ? "A senha deve ter pelo menos 8 caracteres" : "Senha obrigatória" },
            ]}
          >
            <Input.Password placeholder="Sua senha" />
          </Form.Item>

          <Button block type="primary" htmlType="submit" loading={loading}>
            {isRegister ? "Criar Conta" : "Entrar"}
          </Button>
        </Form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Text type="secondary">
            {isRegister ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
            <Button type="link" onClick={() => setIsRegister(!isRegister)} style={{ padding: 0 }}>
              {isRegister ? "Faça login" : "Cadastre-se"}
            </Button>
          </Text>
        </div>

        {!isRegister && (
          <>
            <Divider>ou</Divider>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button block onClick={startGoogleOAuth}>Entrar com Google</Button>
              <Button block onClick={startGithubOAuth}>Entrar com GitHub</Button>
            </Space>
          </>
        )}
      </Card>
    </div>
  );
}

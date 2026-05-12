import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Alert, Button, Card, Form, Input, Space, Table, Tag, Typography, message } from "antd";
import { publishIntegrationEvent } from "../../../bff-client";
import { useSession } from "../../auth/context/session-context";
import { PageHeader } from "../../../shared/ui/page-header";
import { WorkflowPanel } from "../../../shared/ui/workflow-panel";
import { toReadableDate } from "../../../shared/utils/formatters";

const { Text } = Typography;

export function IntegrationsPage({ embedded = false }) {
  const [messageApi, messageContextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [history, setHistory] = useState([]);
  const { hasPermission } = useSession();
  const canPublish = hasPermission("system.settings.manage");

  const publishMutation = useMutation({
    mutationFn: publishIntegrationEvent,
    onSuccess: (result, variables) => {
      form.resetFields(["correlationId"]);
      setHistory((current) => [
        {
          key: `${Date.now()}-${result.eventId}`,
          type: variables.type,
          accepted: result.accepted,
          duplicate: result.duplicate,
          eventId: result.eventId,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 30));
      void messageApi.success("Evento publicado com sucesso.");
    },
    onError: (error) => {
      void messageApi.error(error instanceof Error ? error.message : "Falha ao publicar evento.");
    },
  });

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {messageContextHolder}
      {!embedded ? (
        <PageHeader
          title="Integrações"
          subtitle="Publicação manual de eventos com controle de duplicidade e rastreio."
        />
      ) : null}

      <WorkflowPanel
        title="Fluxo de publicação"
        steps={["Definir tipo e correlação", "Validar payload JSON", "Publicar e conferir retorno no histórico"]}
      />

      <Card title="Publicar evento">
        {!canPublish ? (
          <Alert type="warning" showIcon message="Sem permissão" description="A permissão system.settings.manage é necessária para publicar eventos." />
        ) : (
          <Form
            form={form}
            layout="vertical"
            initialValues={{ type: "", correlationId: "", payload: "{\n  \"example\": true\n}" }}
            onFinish={(values) => {
              let parsedPayload;
              try {
                parsedPayload = JSON.parse(values.payload);
              } catch {
                void messageApi.error("Payload JSON inválido.");
                return;
              }
              publishMutation.mutate({
                type: values.type.trim(),
                correlationId: values.correlationId.trim() || undefined,
                payload: parsedPayload,
              });
            }}
          >
            <Text className="form-helper">Use somente para testes operacionais controlados e incident response.</Text>
            <div className="form-grid form-grid-2">
              <Form.Item label="Tipo de evento" name="type" rules={[{ required: true }]}> 
                <Input placeholder="compliance.violation.updated" />
              </Form.Item>
              <Form.Item label="Correlation ID (opcional)" name="correlationId">
                <Input placeholder="req-8f8a6..." />
              </Form.Item>
            </div>
            <Form.Item
              label="Payload JSON"
              name="payload"
              rules={[
                { required: true },
                {
                  validator: (_, value) => {
                    try {
                      const parsed = JSON.parse(String(value ?? ""));
                      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                        return Promise.reject(new Error("Use um objeto JSON."));
                      }
                      return Promise.resolve();
                    } catch {
                      return Promise.reject(new Error("JSON inválido."));
                    }
                  },
                },
              ]}
            >
              <Input.TextArea rows={10} />
            </Form.Item>
            <div className="form-actions">
              <Button onClick={() => form.resetFields()}>Limpar</Button>
              <Button type="primary" htmlType="submit" loading={publishMutation.isPending}>Publicar evento</Button>
            </div>
          </Form>
        )}
      </Card>

      <Card title="Histórico local">
        <Table
          rowKey={(row) => row.key}
          dataSource={history}
          locale={{ emptyText: "Nenhum evento publicado nesta sessão." }}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          columns={[
            { title: "Tipo", dataIndex: "type", key: "type" },
            { title: "Aceito", dataIndex: "accepted", key: "accepted", render: (value) => <Tag color={value ? "green" : "red"}>{value ? "sim" : "não"}</Tag> },
            { title: "Duplicado", dataIndex: "duplicate", key: "duplicate", render: (value) => <Tag color={value ? "gold" : "blue"}>{value ? "sim" : "não"}</Tag> },
            { title: "Event ID", dataIndex: "eventId", key: "eventId", render: (value) => value || "-" },
            { title: "Enviado", dataIndex: "createdAt", key: "createdAt", render: toReadableDate },
          ]}
        />
      </Card>
    </Space>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card, Checkbox, Col, Form, Input, Row, Select, Space, Switch, Table, Tag, Typography, message } from "antd";
import { useMemo, useState } from "react";
import { dispatchNotification, getNotificationPreference, listNotificationLogs, upsertNotificationPreference } from "../../../bff-client";
import { NOTIFICATIONS_FILTER_URL_SCHEMA } from "../notifications-url-state-schema";
import { useUrlState } from "../../../shared/hooks/use-url-state";
import { useSession } from "../../auth/context/session-context";
import { PageHeader } from "../../../shared/ui/page-header";
import { WorkflowPanel } from "../../../shared/ui/workflow-panel";
import { NotificationStatusTag } from "../../../shared/ui/status-tags";
import { toReadableDate } from "../../../shared/utils/formatters";

const { Text } = Typography;

export function NotificationsPage({ embedded = false }) {
  const [messageApi, messageContextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [preferencesForm] = Form.useForm();
  const [filterValues, setFilterValues] = useUrlState(NOTIFICATIONS_FILTER_URL_SCHEMA);
  const [preferencesRecipient, setPreferencesRecipient] = useState("");
  const { hasPermission } = useSession();
  const canDispatch = hasPermission("system.settings.manage");
  const canManagePreferences = hasPermission("system.settings.manage");
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ["notifications", "logs"],
    queryFn: listNotificationLogs,
  });

  const filteredLogs = useMemo(() => {
    const items = logsQuery.data?.items ?? [];
    return items.filter((item) => {
      if (filterValues.channel !== "all" && item.channel !== filterValues.channel) return false;
      if (filterValues.severity !== "all" && item.severity !== filterValues.severity) return false;
      if (filterValues.status !== "all" && item.status !== filterValues.status) return false;
      if (filterValues.recipient && !item.recipient.toLowerCase().includes(filterValues.recipient.toLowerCase())) return false;
      return true;
    });
  }, [filterValues.channel, filterValues.recipient, filterValues.severity, filterValues.status, logsQuery.data?.items]);

  const dispatchMutation = useMutation({
    mutationFn: dispatchNotification,
    onSuccess: async () => {
      form.resetFields();
      await queryClient.invalidateQueries({ queryKey: ["notifications", "logs"] });
      void messageApi.success("Notificação enviada.");
    },
    onError: (error) => {
      void messageApi.error(error instanceof Error ? error.message : "Falha ao disparar notificação.");
    },
  });

  const loadPreferencesMutation = useMutation({
    mutationFn: (recipient) => getNotificationPreference(recipient),
    onSuccess: (preference) => {
      preferencesForm.setFieldsValue({
        channels: preference.channels,
        frequency: preference.frequency,
        grouping: preference.grouping,
        muteLowMedium: preference.muteLowMedium,
      });
      void messageApi.success("Preferências carregadas.");
    },
    onError: (error) => {
      void messageApi.error(error instanceof Error ? error.message : "Falha ao carregar preferências.");
    },
  });

  const upsertPreferencesMutation = useMutation({
    mutationFn: ({ recipient, payload }) => upsertNotificationPreference(recipient, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications", "logs"] });
      void messageApi.success("Preferências salvas.");
    },
    onError: (error) => {
      void messageApi.error(error instanceof Error ? error.message : "Falha ao salvar preferências.");
    },
  });

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {messageContextHolder}
      {!embedded ? (
        <PageHeader
          title="Notificações"
          subtitle="Disparo operacional com histórico e rastreio por canal."
        />
      ) : null}

      <WorkflowPanel
        title="Fluxo de comunicação"
        steps={["Escolher canal e severidade", "Validar destinatário e mensagem", "Disparar e acompanhar status no histórico"]}
      />

      <Card title="Histórico de notificações">
        <Row gutter={[12, 8]} style={{ marginBottom: 12 }}>
          <Col xs={24} sm={12} lg={6}>
            <Select
              style={{ width: "100%" }}
              value={filterValues.channel}
              options={[{ label: "Canal: todos", value: "all" }, { label: "email", value: "email" }, { label: "webhook", value: "webhook" }]}
              onChange={(channel) => setFilterValues({ ...filterValues, channel })}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Select
              style={{ width: "100%" }}
              value={filterValues.severity}
              options={[
                { label: "Severidade: todas", value: "all" },
                { label: "low", value: "low" },
                { label: "medium", value: "medium" },
                { label: "high", value: "high" },
                { label: "critical", value: "critical" },
              ]}
              onChange={(severity) => setFilterValues({ ...filterValues, severity })}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Select
              style={{ width: "100%" }}
              value={filterValues.status}
              options={[
                { label: "Status: todos", value: "all" },
                { label: "sent", value: "sent" },
                { label: "failed", value: "failed" },
                { label: "dead_letter", value: "dead_letter" },
              ]}
              onChange={(status) => setFilterValues({ ...filterValues, status })}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Input
              style={{ width: "100%" }}
              value={filterValues.recipient}
              placeholder="Filtrar destinatário"
              onChange={(event) => setFilterValues({ ...filterValues, recipient: event.target.value })}
            />
          </Col>
        </Row>
        <Table
          rowKey={(row) => row.id}
          loading={logsQuery.isLoading}
          dataSource={filteredLogs}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          columns={[
            { title: "Canal", dataIndex: "channel", key: "channel", render: (value) => <Tag>{value}</Tag> },
            { title: "Destinatário", dataIndex: "recipient", key: "recipient" },
            { title: "Severidade", dataIndex: "severity", key: "severity", render: (value) => <Tag>{value}</Tag> },
            { title: "Status", dataIndex: "status", key: "status", render: (value) => <NotificationStatusTag value={value} /> },
            { title: "Tentativas", dataIndex: "attempts", key: "attempts" },
            { title: "Criado em", dataIndex: "createdAtUTC", key: "createdAtUTC", render: toReadableDate },
          ]}
        />
      </Card>

      <Card title="Disparo manual">
        {!canDispatch ? (
          <Alert type="info" showIcon message="Sem permissão" description="A permissão system.settings.manage é necessária para disparo manual." />
        ) : (
          <Form
            form={form}
            layout="vertical"
            initialValues={{ channel: "email", severity: "medium", recipient: "", message: "" }}
            onFinish={(values) => dispatchMutation.mutate(values)}
          >
            <Text className="form-helper">Use somente em cenário administrativo ou resposta a incidente.</Text>
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item label="Canal de envio" name="channel" rules={[{ required: true }]}>
                  <Select options={[{ label: "Email", value: "email" }, { label: "Webhook", value: "webhook" }]} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Severidade da mensagem" name="severity" rules={[{ required: true }]}>
                  <Select options={[{ label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" }, { label: "Critical", value: "critical" }]} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Destinatário" name="recipient" rules={[{ required: true }]}>
              <Input placeholder="ops@empresa.com ou https://endpoint/webhook" />
            </Form.Item>
            <Form.Item label="Mensagem" name="message" rules={[{ required: true }, { min: 10 }]}>
              <Input.TextArea rows={4} maxLength={320} showCount />
            </Form.Item>
            <div className="form-actions">
              <Button onClick={() => form.resetFields()}>Limpar</Button>
              <Button type="primary" htmlType="submit" loading={dispatchMutation.isPending}>Disparar</Button>
            </div>
          </Form>
        )}
      </Card>

      <Card title="Preferências por destinatário (RN-056)">
        {!canManagePreferences ? (
          <Alert type="info" showIcon message="Sem permissão" description="A permissão system.settings.manage é necessária para gerenciar preferências." />
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Text className="form-helper">
              Preferências afetam apenas notificações low/medium. Alertas high/critical são sempre obrigatórios.
            </Text>
            <Space.Compact style={{ width: "100%" }}>
              <Input
                value={preferencesRecipient}
                onChange={(event) => setPreferencesRecipient(event.target.value)}
                placeholder="Destinatário (email)"
              />
              <Button
                onClick={() => loadPreferencesMutation.mutate(preferencesRecipient)}
                loading={loadPreferencesMutation.isPending}
                disabled={!preferencesRecipient.trim()}
              >
                Carregar
              </Button>
            </Space.Compact>

            <Form
              form={preferencesForm}
              layout="vertical"
              initialValues={{
                channels: ["email"],
                frequency: "immediate",
                grouping: false,
                muteLowMedium: false,
              }}
              onFinish={(values) => upsertPreferencesMutation.mutate({
                recipient: preferencesRecipient,
                payload: values,
              })}
            >
              <Form.Item label="Canais" name="channels" rules={[{ required: true, message: "Selecione ao menos um canal." }]}>
                <Checkbox.Group options={[{ label: "Email", value: "email" }, { label: "Webhook", value: "webhook" }]} />
              </Form.Item>
              <Form.Item label="Frequência" name="frequency" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: "Imediata", value: "immediate" },
                    { label: "Resumo por hora", value: "hourly_digest" },
                    { label: "Resumo diário", value: "daily_digest" },
                  ]}
                />
              </Form.Item>
              <Form.Item label="Agrupamento" name="grouping" valuePropName="checked">
                <Switch checkedChildren="Ligado" unCheckedChildren="Desligado" />
              </Form.Item>
              <Form.Item label="Silenciar low/medium" name="muteLowMedium" valuePropName="checked">
                <Switch checkedChildren="Ligado" unCheckedChildren="Desligado" />
              </Form.Item>
              <div className="form-actions">
                <Button onClick={() => preferencesForm.resetFields()}>Limpar</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={upsertPreferencesMutation.isPending}
                  disabled={!preferencesRecipient.trim()}
                >
                  Salvar preferências
                </Button>
              </div>
            </Form>
          </Space>
        )}
      </Card>
    </Space>
  );
}

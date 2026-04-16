import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card, Form, Input, Select, Space, Table, Tag, Typography, message } from "antd";
import { dispatchNotification, listNotificationLogs } from "../../../bff-client";
import { useSession } from "../../auth/context/session-context";
import { PageHeader } from "../../../shared/ui/page-header";
import { NotificationStatusTag } from "../../../shared/ui/status-tags";
import { toReadableDate } from "../../../shared/utils/formatters";

const { Text } = Typography;

export function NotificationsPage({ embedded = false }) {
  const [messageApi, messageContextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const { hasPermission } = useSession();
  const canDispatch = hasPermission("system.settings.manage");
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ["notifications", "logs"],
    queryFn: listNotificationLogs,
  });

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

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {messageContextHolder}
      {!embedded ? (
        <PageHeader
          title="Notificações"
          subtitle="Disparo administrativo e histórico de entrega por canal."
        />
      ) : null}

      <Card title="Histórico de notificações">
        <Table
          rowKey={(row) => row.id}
          loading={logsQuery.isLoading}
          dataSource={logsQuery.data?.items ?? []}
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

      <Card title="Disparar notificação">
        {!canDispatch ? (
          <Alert type="info" showIcon message="Sem permissão" description="A permissão system.settings.manage é necessária para disparo manual." />
        ) : (
          <Form
            form={form}
            layout="vertical"
            initialValues={{ channel: "email", severity: "medium", recipient: "", message: "" }}
            onFinish={(values) => dispatchMutation.mutate(values)}
          >
            <Text className="form-helper">Canal, destinatário e severidade devem refletir o playbook de comunicação do incidente.</Text>
            <div className="form-grid form-grid-2">
              <Form.Item label="Canal" name="channel" rules={[{ required: true }]}>
                <Select options={[{ label: "Email", value: "email" }, { label: "Webhook", value: "webhook" }]} />
              </Form.Item>
              <Form.Item label="Severidade" name="severity" rules={[{ required: true }]}>
                <Select options={[{ label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" }, { label: "Critical", value: "critical" }]} />
              </Form.Item>
            </div>
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
    </Space>
  );
}

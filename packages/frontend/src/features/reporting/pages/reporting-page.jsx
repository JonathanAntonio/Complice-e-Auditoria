import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, Card, Descriptions, Form, Input, Select, Space, Table, Tag, Typography, message } from "antd";
import { exportAndDownloadReport, getReportExport } from "../../../bff-client";
import { useSession } from "../../auth/context/session-context";
import { PageHeader } from "../../../shared/ui/page-header";
import { WorkflowPanel } from "../../../shared/ui/workflow-panel";
import { toReadableDate, triggerBlobDownload } from "../../../shared/utils/formatters";

const { Text } = Typography;

export function ReportingPage({ embedded = false }) {
  const [messageApi, messageContextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [history, setHistory] = useState([]);
  const { session } = useSession();

  const exportMutation = useMutation({
    mutationFn: exportAndDownloadReport,
    onSuccess: ({ job, blob, filename }) => {
      triggerBlobDownload(filename, blob);
      setHistory((current) => [job, ...current.filter((item) => item.id !== job.id)].slice(0, 30));
      void messageApi.success(`Exportação ${job.id} concluída e baixada.`);
    },
    onError: (error) => {
      void messageApi.error(error instanceof Error ? error.message : "Falha ao gerar exportação.");
    },
  });

  const lookupMutation = useMutation({
    mutationFn: getReportExport,
    onSuccess: (job) => {
      setLookupResult(job);
      setHistory((current) => [job, ...current.filter((item) => item.id !== job.id)].slice(0, 30));
    },
    onError: (error) => {
      void messageApi.error(error instanceof Error ? error.message : "Falha ao consultar exportação.");
    },
  });

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {messageContextHolder}
      {!embedded ? (
        <PageHeader
          title="Relatórios"
          subtitle="Exportações operacionais com rastreio por ID e histórico de execução."
        />
      ) : null}

      <WorkflowPanel
        title="Fluxo de exportação"
        steps={["Selecionar escopo e responsável", "Gerar CSV e validar download", "Consultar ID quando precisar revalidar status"]}
      />

      <Card title="Etapa 1: gerar exportação">
        <Form
          form={form}
          layout="vertical"
          initialValues={{ scope: "violations", requestedBy: session?.name ?? "Usuário" }}
          onFinish={(values) => exportMutation.mutate({
            format: "csv",
            scope: values.scope,
            requestedBy: values.requestedBy?.trim() || session?.name || "Usuário",
          })}
        >
          <Text className="form-helper">Use o escopo correto para evitar retrabalho na investigação.</Text>
          <div className="form-grid form-grid-2">
            <Form.Item label="Escopo da exportação" name="scope" rules={[{ required: true }]}>
              <Select options={[{ label: "Violações", value: "violations" }, { label: "Auditoria", value: "audit" }, { label: "Risco", value: "risk" }]} />
            </Form.Item>
            <Form.Item label="Responsável pela solicitação" name="requestedBy" rules={[{ required: true }]}>
              <Input maxLength={120} placeholder="Nome para rastreabilidade" />
            </Form.Item>
          </div>
          <div className="form-actions">
            <Button onClick={() => form.resetFields()}>Limpar</Button>
            <Button type="primary" htmlType="submit" loading={exportMutation.isPending}>Gerar e baixar CSV</Button>
          </div>
        </Form>
      </Card>

      <Card title="Etapa 2: consultar exportação por ID">
        <Text className="form-helper">Cole o ID de uma execução para confirmar status e metadados.</Text>
        <div className="form-grid form-grid-2">
          <Space.Compact style={{ width: "100%" }}>
            <Input value={lookupId} onChange={(event) => setLookupId(event.target.value)} placeholder="ID da exportação" />
            <Button loading={lookupMutation.isPending} onClick={() => lookupId.trim() && lookupMutation.mutate(lookupId.trim())}>Consultar</Button>
          </Space.Compact>
        </div>
        {lookupResult ? (
          <Descriptions bordered size="small" column={1} style={{ marginTop: 12 }}>
            <Descriptions.Item label="ID">{lookupResult.id}</Descriptions.Item>
            <Descriptions.Item label="Status">{lookupResult.status}</Descriptions.Item>
            <Descriptions.Item label="Escopo">{lookupResult.scope}</Descriptions.Item>
            <Descriptions.Item label="Criado em">{toReadableDate(lookupResult.createdAtUTC)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card title="Histórico local">
        <Table
          rowKey={(row) => row.id}
          dataSource={history}
          locale={{ emptyText: "Sem exportações nesta sessão." }}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          columns={[
            { title: "ID", dataIndex: "id", key: "id" },
            { title: "Escopo", dataIndex: "scope", key: "scope" },
            { title: "Formato", dataIndex: "format", key: "format" },
            { title: "Status", dataIndex: "status", key: "status", render: (value) => <Tag>{value}</Tag> },
            { title: "Criado", dataIndex: "createdAtUTC", key: "createdAtUTC", render: toReadableDate },
          ]}
        />
      </Card>
    </Space>
  );
}

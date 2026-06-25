import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, Card, Col, Descriptions, Form, Input, Row, Select, Space, Table, Tag, Typography, message } from "antd";
import { exportAndDownloadReport, getReportExport } from "../../../bff-client";
import { useSession } from "../../auth/context/session-context";
import { REPORTING_URL_STATE_SCHEMA } from "../reporting-url-state-schema";
import { useUrlState } from "../../../shared/hooks/use-url-state";
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
  const [urlState, setUrlState] = useUrlState(REPORTING_URL_STATE_SCHEMA);

  const initialValues = useMemo(
    () => ({
      format: urlState.format,
      scope: urlState.scope,
      requestedBy: session?.name ?? "Usuário",
      period: urlState.period,
      area: urlState.area,
      eventType: urlState.eventType,
      riskLevel: urlState.riskLevel,
      violationStatus: urlState.violationStatus,
    }),
    [session?.name, urlState],
  );

  const syncFormToUrl = (allValues) => {
    setUrlState({
      format: allValues.format || "csv",
      scope: allValues.scope || "violations",
      period: allValues.period || "7d",
      area: allValues.area || "",
      eventType: allValues.eventType || "",
      riskLevel: allValues.riskLevel || "",
      violationStatus: allValues.violationStatus || "",
    });
  };

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
        steps={["Selecionar escopo, formato e filtros", "Gerar arquivo e validar metadados", "Consultar ID quando precisar revalidar status"]}
      />

      <Card title="Etapa 1: gerar exportação">
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          key={JSON.stringify(initialValues)}
          onValuesChange={(_, allValues) => syncFormToUrl(allValues)}
          onFinish={(values) => exportMutation.mutate({
            format: values.format,
            scope: values.scope,
            requestedBy: values.requestedBy?.trim() || session?.name || "Usuário",
            filters: {
              period: values.period,
              area: values.area || undefined,
              eventType: values.eventType || undefined,
              riskLevel: values.riskLevel || undefined,
              violationStatus: values.violationStatus || undefined,
            },
          })}
        >
          <Text className="form-helper">Use o escopo correto para evitar retrabalho na investigação.</Text>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item label="Formato" name="format" rules={[{ required: true }]}>
                <Select options={[{ label: "CSV", value: "csv" }, { label: "PDF", value: "pdf" }]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Escopo da exportação" name="scope" rules={[{ required: true }]}>
                <Select options={[{ label: "Violações", value: "violations" }, { label: "Auditoria", value: "audit" }, { label: "Risco", value: "risk" }]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Responsável pela solicitação" name="requestedBy" rules={[{ required: true }]}>
                <Input maxLength={120} placeholder="Nome para rastreabilidade" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Período" name="period" rules={[{ required: true }]}>
                <Select options={[{ label: "24 horas", value: "24h" }, { label: "7 dias", value: "7d" }, { label: "30 dias", value: "30d" }]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Área" name="area">
                <Input maxLength={120} placeholder="Ex.: finance" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Tipo de evento" name="eventType">
                <Input maxLength={120} placeholder="Ex.: invoice_updated" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Nível de risco" name="riskLevel">
                <Select options={[{ label: "Todos", value: "" }, { label: "low", value: "low" }, { label: "medium", value: "medium" }, { label: "high", value: "high" }, { label: "critical", value: "critical" }]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Status da violação" name="violationStatus">
                <Select options={[{ label: "Todos", value: "" }, { label: "aberta", value: "aberta" }, { label: "resolvida", value: "resolvida" }, { label: "dispensada", value: "dispensada" }]} />
              </Form.Item>
            </Col>
          </Row>
          <div className="form-actions">
            <Button onClick={() => form.resetFields()}>Limpar</Button>
            <Button type="primary" htmlType="submit" loading={exportMutation.isPending}>Gerar e baixar</Button>
          </div>
        </Form>
      </Card>

      <Card title="Etapa 2: consultar exportação por ID">
        <Text className="form-helper">Cole o ID de uma execução para confirmar status e metadados.</Text>
        <Space.Compact style={{ width: "100%", maxWidth: 480 }}>
          <Input
            value={lookupId}
            onChange={(event) => {
              setLookupId(event.target.value);
              if (!event.target.value.trim()) {
                setLookupResult(null);
              }
            }}
            onPressEnter={() => {
              if (lookupId.trim()) lookupMutation.mutate(lookupId.trim());
            }}
            placeholder="ID da exportação"
          />
          <Button
            loading={lookupMutation.isPending}
            disabled={!lookupId.trim()}
            onClick={() => lookupMutation.mutate(lookupId.trim())}
          >
            Consultar
          </Button>
        </Space.Compact>
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

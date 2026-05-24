import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Timeline,
  Typography,
} from "antd";
import { RefreshCw } from "lucide-react";
import { getMessagingFlowSnapshot } from "../../../bff-client";
import { DEFAULT_MESSAGING_FILTERS, MESSAGING_URL_STATE_SCHEMA } from "../messaging-url-state-schema";
import { useUrlState } from "../../../shared/hooks/use-url-state";
import { PageHeader } from "../../../shared/ui/page-header";
import { WorkflowPanel } from "../../../shared/ui/workflow-panel";
import { toReadableDate, toRelativeTime } from "../../../shared/utils/formatters";

const { Text } = Typography;

function resolveHealthColor(value) {
  if (value <= 0) return "green";
  if (value <= 3) return "gold";
  return "red";
}

export function MessagingFlowPage() {
  const [initialFilters, setUrlFilters] = useUrlState(MESSAGING_URL_STATE_SCHEMA);
  const [filterForm] = Form.useForm();
  const [filters, setFilters] = useState(initialFilters);

  const syncFiltersToUrl = (next) => {
    setUrlFilters(next);
  };

  const flowQuery = useQuery({
    queryKey: ["messaging-flow", "snapshot", filters],
    queryFn: () => getMessagingFlowSnapshot(filters),
    refetchInterval: (query) => (query.state.error ? false : 20000),
  });

  const snapshot = flowQuery.data;
  const summary = snapshot?.summary;
  const flowNodes = snapshot?.flowNodes ?? [];
  const serviceMetrics = snapshot?.consumers ?? [];
  const auditItems = snapshot?.recentAuditEvents ?? [];
  const failureItems = snapshot?.recentFailures ?? [];
  const deadLetterCount = summary?.deadLetterNotifications ?? 0;
  const failedCount = summary?.failedNotifications ?? 0;
  const integrationEvents = summary?.integrationEventsSample ?? 0;
  const consumerEvents = summary?.consumerEventsSample ?? 0;
  const topEventTypes = snapshot?.topEventTypes ?? [];

  const serviceOptions = [...new Set(serviceMetrics.map((item) => item.service))].map((service) => ({
    label: service,
    value: service,
  }));

  const resetFilters = () => {
    filterForm.resetFields();
    setFilters(DEFAULT_MESSAGING_FILTERS);
    setUrlFilters(DEFAULT_MESSAGING_FILTERS);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader
        title="Fluxo de mensageria"
        subtitle="Triagem, diagnóstico e resposta para eventos, consumidores e fila de falhas."
        actions={[
          <Button key="refresh" icon={<RefreshCw size={16} />} onClick={() => void flowQuery.refetch()}>
            Atualizar
          </Button>,
          <Button key="reset" onClick={resetFilters}>Limpar filtros</Button>,
        ]}
      />

      <WorkflowPanel
        title="Fluxo operacional"
        steps={["Aplicar filtros de triagem", "Priorizar falhas e DLQ", "Aprofundar diagnóstico por consumidor e correlação"]}
      />

      {flowQuery.error ? (
        <Alert
          type="error"
          showIcon
          message="Falha ao carregar fluxo"
          description={flowQuery.error instanceof Error ? flowQuery.error.message : "Erro inesperado."}
        />
      ) : null}

      <Card title="Triagem operacional">
        <Form
          form={filterForm}
          layout="vertical"
          initialValues={{
            sourceService: filters.sourceService,
            eventType: filters.eventType,
            correlationId: filters.correlationId,
            notificationStatus: filters.notificationStatus,
            onlyFailures: filters.onlyFailures,
          }}
          onFinish={(values) => {
            const next = {
              ...filters,
              sourceService: values.sourceService,
              eventType: values.eventType ?? "",
              correlationId: values.correlationId ?? "",
              notificationStatus: values.notificationStatus,
              onlyFailures: Boolean(values.onlyFailures),
            };
            setFilters(next);
            syncFiltersToUrl(next);
          }}
        >
          <div className="form-grid form-grid-2">
            <Form.Item label="Serviço" name="sourceService">
              <Select allowClear placeholder="Selecione o serviço" options={serviceOptions} />
            </Form.Item>
            <Form.Item label="Status de notificação" name="notificationStatus">
              <Select
                allowClear
                placeholder="Selecione o status"
                options={[
                  { label: "sent", value: "sent" },
                  { label: "failed", value: "failed" },
                  { label: "dead_letter", value: "dead_letter" },
                ]}
              />
            </Form.Item>
          </div>
          <div className="form-grid form-grid-2">
            <Form.Item label="Tipo de evento" name="eventType">
              <Input placeholder="Ex: compliance.violation.updated" />
            </Form.Item>
            <Form.Item label="ID de correlação" name="correlationId">
              <Input placeholder="req-123..." />
            </Form.Item>
          </div>
          <Form.Item label="Filtro rápido" name="onlyFailures" valuePropName="checked">
            <Switch checkedChildren="Só falhas" unCheckedChildren="Todos" />
          </Form.Item>
          <div className="form-actions">
            <Button onClick={resetFilters}>Limpar</Button>
            <Button type="primary" htmlType="submit">Aplicar filtros</Button>
          </div>
        </Form>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}><Card><Statistic title="Eventos integração (amostra)" value={integrationEvents} /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card><Statistic title="Eventos consumidos (amostra)" value={consumerEvents} /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card><Statistic title="Falhas notificação" value={failedCount} valueStyle={{ color: failedCount > 0 ? "#d4380d" : "#389e0d" }} /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card><Statistic title="Mensagens em DLQ" value={deadLetterCount} valueStyle={{ color: deadLetterCount > 0 ? "#cf1322" : "#389e0d" }} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}><Card><Statistic title="Taxa global de falha" value={summary?.failureRatePercent ?? 0} precision={2} suffix="%" /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Serviços ativos (amostra)" value={summary?.activeServices ?? 0} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Correlações únicas" value={summary?.uniqueCorrelationIds ?? 0} /></Card></Col>
      </Row>

      <Card title="Mapa do fluxo">
        <Timeline
          items={flowNodes.map((node) => ({
            color: "blue",
            children: (
              <Space direction="vertical" size={0}>
                <Text strong>{node.label}</Text>
                <Text type="secondary">{node.description}</Text>
              </Space>
            ),
          }))}
        />
      </Card>

      <Card title="Top tipos de evento">
        <Table
          size="small"
          rowKey={(row) => row.eventType}
          pagination={false}
          dataSource={topEventTypes}
          locale={{ emptyText: "Sem eventos para o filtro atual." }}
          columns={[{ title: "Tipo de evento", dataIndex: "eventType", key: "eventType" }, { title: "Ocorrências", dataIndex: "count", key: "count" }]}
        />
      </Card>

      <Card title="Últimos eventos de auditoria ligados à mensageria">
        <Table
          size="small"
          rowKey={(row) => row.eventId}
          loading={flowQuery.isLoading}
          dataSource={auditItems.slice(0, 12)}
          pagination={false}
          locale={{ emptyText: "Sem eventos de auditoria." }}
          columns={[
            { title: "Evento", dataIndex: "eventType", key: "eventType" },
            { title: "Serviço", dataIndex: "sourceService", key: "sourceService", render: (value) => <Tag>{value}</Tag> },
            { title: "Correlação", dataIndex: "correlationId", key: "correlationId", render: (value) => value || "-" },
            { title: "Quando", dataIndex: "occurredAtUTC", key: "occurredAtUTC", render: (value) => toRelativeTime(value) },
          ]}
        />
      </Card>

      <Card title="Fila de falhas (notificações)">
        <Table
          size="small"
          rowKey={(row) => row.id}
          loading={flowQuery.isLoading}
          dataSource={failureItems.slice(0, 10)}
          pagination={false}
          locale={{ emptyText: "Sem falhas recentes." }}
          columns={[
            { title: "Canal", dataIndex: "channel", key: "channel", render: (value) => <Tag>{value}</Tag> },
            { title: "Destino", dataIndex: "recipient", key: "recipient" },
            { title: "Tentativas", dataIndex: "attempts", key: "attempts", render: (value) => value ?? "-" },
            { title: "Status", dataIndex: "status", key: "status", render: (value) => <Tag color={value === "dead_letter" ? "red" : "gold"}>{value}</Tag> },
            { title: "Criado em", dataIndex: "createdAtUTC", key: "createdAtUTC", render: (value) => toReadableDate(value) },
          ]}
        />
      </Card>

      <Card title="Taxa de falha por consumidor">
        <Table
          size="small"
          rowKey={(row) => row.service}
          dataSource={serviceMetrics}
          pagination={false}
          columns={[
            { title: "Serviço consumidor", dataIndex: "service", key: "service", render: (value) => <Tag>{value}</Tag> },
            { title: "Eventos processados", dataIndex: "processedSample", key: "processedSample" },
            { title: "Falhas", dataIndex: "failed", key: "failed" },
            { title: "DLQ", dataIndex: "deadLetter", key: "deadLetter" },
            {
              title: "Taxa de falha",
              dataIndex: "failureRate",
              key: "failureRate",
              render: (value) => (
                <Progress
                  percent={Number((value ?? 0).toFixed(1))}
                  size="small"
                  status={value > 15 ? "exception" : value > 5 ? "normal" : "success"}
                />
              ),
            },
          ]}
        />
      </Card>

      <Card title="Saúde da mensageria">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Statistic
              title="Indicador de DLQ"
              value={deadLetterCount}
              valueStyle={{ color: deadLetterCount > 0 ? "#cf1322" : "#389e0d" }}
              suffix={<Tag color={resolveHealthColor(deadLetterCount)}>{deadLetterCount > 3 ? "crítico" : deadLetterCount > 0 ? "atenção" : "ok"}</Tag>}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title="Indicador de falhas"
              value={failedCount}
              valueStyle={{ color: failedCount > 0 ? "#d48806" : "#389e0d" }}
              suffix={<Tag color={resolveHealthColor(failedCount)}>{failedCount > 3 ? "crítico" : failedCount > 0 ? "atenção" : "ok"}</Tag>}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic title="Última atualização" value={snapshot?.generatedAtUTC ? toRelativeTime(snapshot.generatedAtUTC) : "agora"} />
          </Col>
        </Row>
      </Card>
    </Space>
  );
}

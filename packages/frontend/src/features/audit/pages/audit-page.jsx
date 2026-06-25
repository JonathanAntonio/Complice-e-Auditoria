import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Card, Col, Input, Row, Select, Space, Table, Typography } from "antd";
import { listAuditLogs } from "../../../bff-client";
import { AUDIT_FILTER_URL_SCHEMA } from "../audit-url-state-schema";
import { useUrlState } from "../../../shared/hooks/use-url-state";
import { PageHeader } from "../../../shared/ui/page-header";
import { toReadableDate } from "../../../shared/utils/formatters";

const { Text } = Typography;

const SEVERITY_OPTIONS = [
  { label: "Severidade: todas", value: "" },
  { label: "low", value: "low" },
  { label: "medium", value: "medium" },
  { label: "high", value: "high" },
  { label: "critical", value: "critical" },
];

export function AuditPage() {
  const [filters, setFilters] = useUrlState(AUDIT_FILTER_URL_SCHEMA);

  const queryPayload = {
    page: filters.page,
    pageSize: filters.pageSize,
    type: filters.type || undefined,
    actorId: filters.actorId || undefined,
    severity: filters.severity || undefined,
  };

  const logsQuery = useQuery({
    queryKey: ["audit", "logs", queryPayload],
    queryFn: () => listAuditLogs(queryPayload),
  });

  const resetFilters = () => setFilters({ type: "", actorId: "", severity: "", page: 1, pageSize: 20 });

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader
        title="Auditoria"
        subtitle="Trilha de eventos por serviço, severidade, ator e correlação."
      />

      {logsQuery.error ? (
        <Alert
          type="error"
          showIcon
          message="Falha ao carregar auditoria"
          description={logsQuery.error instanceof Error ? logsQuery.error.message : "Erro inesperado ao consultar logs."}
          action={<Button size="small" onClick={() => void logsQuery.refetch()}>Tentar novamente</Button>}
        />
      ) : null}

      <Card>
        <Row gutter={[12, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={8}>
            <Input
              placeholder="Tipo de evento (ex: user.login)"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Input
              placeholder="Ator (ID ou nome)"
              value={filters.actorId}
              onChange={(e) => setFilters({ ...filters, actorId: e.target.value, page: 1 })}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Select
              style={{ width: "100%" }}
              options={SEVERITY_OPTIONS}
              value={filters.severity}
              onChange={(value) => setFilters({ ...filters, severity: value, page: 1 })}
            />
          </Col>
          <Col xs={24} sm={12} lg={2}>
            <Button style={{ width: "100%" }} onClick={resetFilters}>Limpar</Button>
          </Col>
        </Row>

        <Table
          rowKey={(row) => row.eventId}
          loading={logsQuery.isLoading}
          dataSource={logsQuery.data?.items ?? []}
          scroll={{ x: 980 }}
          pagination={{
            current: logsQuery.data?.page ?? filters.page,
            pageSize: logsQuery.data?.pageSize ?? filters.pageSize,
            total: logsQuery.data?.total ?? 0,
            showSizeChanger: true,
          }}
          onChange={(pagination) => {
            setFilters({
              ...filters,
              page: pagination.current ?? 1,
              pageSize: pagination.pageSize ?? 20,
            });
          }}
          columns={[
            { title: "Evento", dataIndex: "eventType", key: "eventType" },
            { title: "Severidade", dataIndex: "severity", key: "severity" },
            { title: "Serviço", dataIndex: "sourceService", key: "sourceService" },
            { title: "Ator", dataIndex: "actorId", key: "actorId", render: (value) => value ?? "-" },
            { title: "Correlation", dataIndex: "correlationId", key: "correlationId", render: (value) => <Text code>{value}</Text> },
            { title: "Ocorrido em", dataIndex: "occurredAtUTC", key: "occurredAtUTC", render: toReadableDate },
          ]}
        />
      </Card>
    </Space>
  );
}

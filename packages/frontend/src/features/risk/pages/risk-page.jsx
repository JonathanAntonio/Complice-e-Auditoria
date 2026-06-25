import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { getRiskScoreHistory, listRiskScores } from "../../../bff-client";
import { PageHeader } from "../../../shared/ui/page-header";
import { toReadableDate } from "../../../shared/utils/formatters";
import { StandardModal } from "../../../shared/ui/standard-modal";
import { WorkflowPanel } from "../../../shared/ui/workflow-panel";

const { Text } = Typography;

const RISK_COLORS = { critical: "#ff4d4f", high: "#fa8c16", medium: "#1677ff", low: "#52c41a" };

const ENTITY_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "Usuário", value: "user" },
  { label: "Área", value: "area" },
  { label: "Processo", value: "process" },
];

const LEVEL_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Critical", value: "critical" },
];

function levelColor(level) {
  if (level === "critical") return "red";
  if (level === "high") return "gold";
  if (level === "medium") return "blue";
  return "green";
}

export function RiskPage() {
  const [filterForm] = Form.useForm();
  const [filters, setFilters] = useState({
    entityType: "all",
    level: "all",
    search: "",
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [sorter, setSorter] = useState({ field: "score", order: "descend" });
  const [historyTarget, setHistoryTarget] = useState(null);

  const queryPayload = useMemo(() => ({
    entityType: filters.entityType === "all" ? undefined : filters.entityType,
    level: filters.level === "all" ? undefined : filters.level,
    search: filters.search.trim() || undefined,
    page: pagination.current,
    pageSize: pagination.pageSize,
    sortBy: sorter.field === "updatedAtUTC" ? "updatedAtUTC" : sorter.field === "level" ? "level" : "score",
    sortDir: sorter.order === "ascend" ? "asc" : "desc",
  }), [filters, pagination.current, pagination.pageSize, sorter.field, sorter.order]);

  const scoresQuery = useQuery({
    queryKey: ["risk", "scores", queryPayload],
    queryFn: () => listRiskScores(queryPayload),
  });

  const historyQuery = useQuery({
    queryKey: ["risk", "history", historyTarget?.entityType, historyTarget?.entityId],
    queryFn: () => getRiskScoreHistory(historyTarget.entityType, historyTarget.entityId, { bucket: "hour" }),
    enabled: Boolean(historyTarget),
  });

  const summary = scoresQuery.data?.summary ?? {
    lowCount: 0,
    mediumCount: 0,
    highCount: 0,
    criticalCount: 0,
  };

  const riskChartData = useMemo(() => [
    { name: "Crítico", quantidade: summary.criticalCount, level: "critical" },
    { name: "Alto",    quantidade: summary.highCount,     level: "high" },
    { name: "Médio",   quantidade: summary.mediumCount,   level: "medium" },
    { name: "Baixo",   quantidade: summary.lowCount,      level: "low" },
  ], [summary.criticalCount, summary.highCount, summary.mediumCount, summary.lowCount]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader
        title="Risco Operacional"
        subtitle="Fluxo de priorização diária das entidades com maior exposição."
      />
      <WorkflowPanel
        title="Fluxo de priorização"
        steps={["Filtrar entidade e nível de risco", "Priorizar casos críticos/altos", "Analisar tendência no histórico antes da decisão"]}
      />
      {scoresQuery.error ? (
        <Alert
          type="error"
          showIcon
          message="Falha ao carregar priorização de risco"
          description={scoresQuery.error instanceof Error ? scoresQuery.error.message : "Erro inesperado ao consultar risco."}
          action={<Button size="small" onClick={() => void scoresQuery.refetch()}>Tentar novamente</Button>}
        />
      ) : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card><Statistic title="Crítico" value={summary.criticalCount} valueStyle={{ color: "#cf1322" }} /></Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card><Statistic title="Alto" value={summary.highCount} valueStyle={{ color: "#d48806" }} /></Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card><Statistic title="Médio" value={summary.mediumCount} valueStyle={{ color: "#1677ff" }} /></Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card><Statistic title="Baixo" value={summary.lowCount} valueStyle={{ color: "#389e0d" }} /></Card>
        </Col>
      </Row>

      <Card title="Distribuição por nível de risco" loading={scoresQuery.isLoading && !scoresQuery.data}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={riskChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
              {riskChartData.map((entry) => (
                <Cell key={entry.level} fill={RISK_COLORS[entry.level]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Fila de priorização de risco">
        <Form
          form={filterForm}
          layout="vertical"
          initialValues={{ entityType: "all", level: "all", search: "" }}
          onFinish={(values) => {
            setPagination((current) => ({ ...current, current: 1 }));
            setFilters({
              entityType: values.entityType,
              level: values.level,
              search: values.search ?? "",
            });
          }}
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item label="Tipo de entidade" name="entityType">
                <Select options={ENTITY_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Nível" name="level">
                <Select options={LEVEL_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Busca por entidade (ID)" name="search">
            <Input placeholder="ex: user-123, financeiro, approval" />
          </Form.Item>
          <div className="form-actions">
            <Button onClick={() => {
              filterForm.resetFields();
              setPagination((current) => ({ ...current, current: 1 }));
              setFilters({ entityType: "all", level: "all", search: "" });
            }}
            >
              Limpar
            </Button>
            <Button type="primary" htmlType="submit">Aplicar filtros</Button>
          </div>
        </Form>

        <Table
          rowKey={(row) => `${row.entityType}:${row.entityId}`}
          style={{ marginTop: 12 }}
          loading={scoresQuery.isLoading}
          dataSource={scoresQuery.data?.items ?? []}
          pagination={{
            current: scoresQuery.data?.page ?? pagination.current,
            pageSize: scoresQuery.data?.pageSize ?? pagination.pageSize,
            total: scoresQuery.data?.total ?? 0,
            showSizeChanger: true,
          }}
          onChange={(nextPagination, _filters, nextSorter) => {
            setPagination({
              current: nextPagination.current ?? 1,
              pageSize: nextPagination.pageSize ?? 10,
            });
            if (!Array.isArray(nextSorter)) {
              setSorter({
                field: typeof nextSorter.field === "string" ? nextSorter.field : "score",
                order: nextSorter.order ?? "descend",
              });
            }
          }}
          columns={[
            { title: "Tipo", dataIndex: "entityType", key: "entityType", render: (value) => <Tag>{value}</Tag> },
            { title: "Entidade", dataIndex: "entityId", key: "entityId" },
            { title: "Score", dataIndex: "score", key: "score", sorter: true, defaultSortOrder: "descend" },
            { title: "Nível", dataIndex: "level", key: "level", sorter: true, render: (value) => <Tag color={levelColor(value)}>{value}</Tag> },
            { title: "Atualizado", dataIndex: "updatedAtUTC", key: "updatedAtUTC", sorter: true, render: toReadableDate },
            {
              title: "Ações",
              key: "actions",
              render: (_, row) => (
                <Button size="small" onClick={() => setHistoryTarget({ entityType: row.entityType, entityId: row.entityId })}>
                  Ver histórico
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <StandardModal
        title={historyTarget ? `Histórico: ${historyTarget.entityType}/${historyTarget.entityId}` : "Histórico"}
        description="Evolução temporal do score para apoiar decisão de resposta."
        open={Boolean(historyTarget)}
        onCancel={() => setHistoryTarget(null)}
        footer={null}
      >
        {historyQuery.error ? (
          <Alert
            type="error"
            showIcon
            message="Falha ao carregar histórico"
            description={historyQuery.error instanceof Error ? historyQuery.error.message : "Erro inesperado ao consultar histórico."}
            action={<Button size="small" onClick={() => void historyQuery.refetch()}>Tentar novamente</Button>}
          />
        ) : null}
        {historyQuery.data ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              <Text><strong>Janela:</strong> {toReadableDate(historyQuery.data.fromUTC)} — {toReadableDate(historyQuery.data.toUTC)}</Text>
              <Tag color={historyQuery.data.delta >= 0 ? "red" : "green"}>
                Delta: {historyQuery.data.delta >= 0 ? `+${historyQuery.data.delta}` : historyQuery.data.delta}
              </Tag>
            </Space>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={historyQuery.data.points.map((p) => ({
                  ...p,
                  bucket: toReadableDate(p.bucketUTC),
                }))}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value, name) => [value, "Score"]} />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#1677ff" dot={{ r: 3 }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Space>
        ) : (
          <Text type="secondary">{historyQuery.isLoading ? "Carregando histórico..." : "Sem histórico para esta entidade."}</Text>
        )}
      </StandardModal>
    </Space>
  );
}

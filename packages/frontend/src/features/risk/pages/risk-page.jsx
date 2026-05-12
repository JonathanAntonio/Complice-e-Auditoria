import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import { getRiskScoreHistory, listRiskScores } from "../../../bff-client";
import { PageHeader } from "../../../shared/ui/page-header";
import { toReadableDate } from "../../../shared/utils/formatters";
import { StandardModal } from "../../../shared/ui/standard-modal";
import { WorkflowPanel } from "../../../shared/ui/workflow-panel";

const { Text } = Typography;

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

      <Card>
        <Space size="large" wrap>
          <Statistic title="Crítico" value={summary.criticalCount} valueStyle={{ color: "#cf1322" }} />
          <Statistic title="Alto" value={summary.highCount} valueStyle={{ color: "#d48806" }} />
          <Statistic title="Médio" value={summary.mediumCount} valueStyle={{ color: "#1677ff" }} />
          <Statistic title="Baixo" value={summary.lowCount} valueStyle={{ color: "#389e0d" }} />
          <Statistic title="Gerado em" value={toReadableDate(scoresQuery.data?.generatedAtUTC)} />
        </Space>
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
          <div className="form-grid form-grid-2">
            <Form.Item label="Tipo de entidade" name="entityType">
              <Select options={ENTITY_OPTIONS} />
            </Form.Item>
            <Form.Item label="Nível" name="level">
              <Select options={LEVEL_OPTIONS} />
            </Form.Item>
          </div>
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
        {historyQuery.data ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Text><strong>Janela:</strong> {toReadableDate(historyQuery.data.fromUTC)} - {toReadableDate(historyQuery.data.toUTC)}</Text>
            <Text><strong>Delta:</strong> {historyQuery.data.delta >= 0 ? `+${historyQuery.data.delta}` : historyQuery.data.delta}</Text>
            <Table
              size="small"
              rowKey={(row) => row.bucketUTC}
              dataSource={historyQuery.data.points}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              columns={[
                { title: "Bucket", dataIndex: "bucketUTC", key: "bucketUTC", render: toReadableDate },
                { title: "Score", dataIndex: "score", key: "score" },
                { title: "Nível", dataIndex: "level", key: "level", render: (value) => <Tag color={levelColor(value)}>{value}</Tag> },
              ]}
            />
          </Space>
        ) : (
          <Text type="secondary">{historyQuery.isLoading ? "Carregando histórico..." : "Sem histórico para esta entidade."}</Text>
        )}
      </StandardModal>
    </Space>
  );
}

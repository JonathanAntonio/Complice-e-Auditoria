import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, Col, Progress, Row, Select, Space, Statistic, Table, Tag, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { listComplianceViolations, updateComplianceViolation } from "../../../bff-client";
import { useSession } from "../../auth/context/session-context";
import { PageHeader } from "../../../shared/ui/page-header";
import { SeverityTag } from "../../../shared/ui/status-tags";
import { toReadableDate } from "../../../shared/utils/formatters";
import { StandardModal } from "../../../shared/ui/standard-modal";
import { WorkflowPanel } from "../../../shared/ui/workflow-panel";

const { Text } = Typography;

const SLA_DAYS = { alta: 3, media: 7, baixa: 14 };
const ACTIVE_STATUSES = new Set(["aberta", "em_analise"]);

function getAgeDays(createdAt) {
  const ms = Date.now() - Date.parse(createdAt);
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function getSlaInfo(severity, ageDays) {
  const limit = SLA_DAYS[severity] ?? 7;
  const pct = Math.min(100, Math.round((ageDays / limit) * 100));
  const breached = ageDays > limit;
  const critical = !breached && pct >= 80;
  return { limit, pct, breached, critical };
}

function AgeBadge({ ageDays, slaInfo }) {
  if (slaInfo.breached) return <Tag color="red">{ageDays}d — SLA estourado</Tag>;
  if (slaInfo.critical) return <Tag color="orange">{ageDays}d — crítico</Tag>;
  if (ageDays <= 1) return <Tag color="green">{ageDays}d — no prazo</Tag>;
  return <Tag color="blue">{ageDays}d — no prazo</Tag>;
}

function SlaBar({ pct, breached }) {
  const status = breached ? "exception" : pct >= 80 ? "active" : "normal";
  const color = breached ? "#ff4d4f" : pct >= 80 ? "#fa8c16" : "#52c41a";
  return <Progress percent={pct} size="small" strokeColor={color} status={status} style={{ marginBottom: 0 }} />;
}

export function ComplianceSlaPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { hasPermission } = useSession();
  const canUpdate = hasPermission("compliance.violations.create");
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("");

  const violationsQuery = useQuery({
    queryKey: ["compliance", "violations"],
    queryFn: listComplianceViolations,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateComplianceViolation(id, payload),
    onSuccess: async () => {
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["compliance", "violations"] });
      void messageApi.success("Status atualizado.");
    },
    onError: (err) => {
      void messageApi.error(err?.message ?? "Falha ao atualizar.");
    },
  });

  const rows = useMemo(() => {
    const active = (violationsQuery.data ?? []).filter((v) => ACTIVE_STATUSES.has(v.status));
    const withSla = active.map((v) => {
      const ageDays = getAgeDays(v.createdAt);
      const slaInfo = getSlaInfo(v.severity, ageDays);
      return { ...v, ageDays, slaInfo };
    });

    const filtered = severityFilter ? withSla.filter((v) => v.severity === severityFilter) : withSla;
    return filtered.sort((a, b) => b.slaInfo.pct - a.slaInfo.pct);
  }, [violationsQuery.data, severityFilter]);

  const stats = useMemo(() => {
    const all = (violationsQuery.data ?? []).filter((v) => ACTIVE_STATUSES.has(v.status));
    const withSla = all.map((v) => {
      const ageDays = getAgeDays(v.createdAt);
      return { ...v, slaInfo: getSlaInfo(v.severity, ageDays) };
    });
    return {
      total: withSla.length,
      breached: withSla.filter((v) => v.slaInfo.breached).length,
      critical: withSla.filter((v) => v.slaInfo.critical && !v.slaInfo.breached).length,
      onTrack: withSla.filter((v) => !v.slaInfo.breached && !v.slaInfo.critical).length,
    };
  }, [violationsQuery.data]);

  const columns = [
    {
      title: "Violação",
      dataIndex: "title",
      key: "title",
      render: (text, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{row.id.slice(0, 8).toUpperCase()}</Text>
        </Space>
      ),
    },
    {
      title: "Severidade",
      dataIndex: "severity",
      key: "severity",
      width: 110,
      render: (v) => <SeverityTag value={v} />,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (v) => v === "em_analise" ? <Tag color="blue">Em análise</Tag> : <Tag color="orange">Aberta</Tag>,
    },
    {
      title: "Idade / SLA",
      key: "sla",
      width: 200,
      render: (_, row) => (
        <Space direction="vertical" size={2} style={{ width: "100%" }}>
          <AgeBadge ageDays={row.ageDays} slaInfo={row.slaInfo} />
          <SlaBar pct={row.slaInfo.pct} breached={row.slaInfo.breached} />
          <Text type="secondary" style={{ fontSize: 11 }}>
            Limite: {row.slaInfo.limit}d · Criada: {toReadableDate(row.createdAt)}
          </Text>
        </Space>
      ),
    },
    {
      title: "Ação",
      key: "action",
      width: 130,
      render: (_, row) =>
        canUpdate ? (
          <Button size="small" onClick={() => setEditing(row)}>
            Atualizar status
          </Button>
        ) : (
          <Text type="secondary">Sem permissão</Text>
        ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {contextHolder}
      <PageHeader
        title="SLA de Violações"
        subtitle="Acompanhe o prazo de tratamento das violações abertas antes do estouro de SLA."
        actions={[
          <Button key="back" onClick={() => navigate("/compliance")}>Ver todas as violações</Button>,
        ]}
      />

      <WorkflowPanel
        title="Priorização por SLA"
        steps={[
          "Resolver primeiro as violações com SLA estourado (vermelho)",
          "Antecipar as em estado crítico (≥ 80% do prazo)",
          "Mover para 'Em análise' para sinalizar tratamento em curso",
        ]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="Abertas / Em análise" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="SLA estourado"
              value={stats.breached}
              valueStyle={{ color: stats.breached > 0 ? "#ff4d4f" : "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Estado crítico (≥ 80%)"
              value={stats.critical}
              valueStyle={{ color: stats.critical > 0 ? "#fa8c16" : "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="No prazo"
              value={stats.onTrack}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Violações ativas por prazo"
        extra={
          <Select
            style={{ width: 140 }}
            placeholder="Severidade"
            allowClear
            value={severityFilter || undefined}
            onChange={(v) => setSeverityFilter(v ?? "")}
            options={[
              { label: "Alta (3d)", value: "alta" },
              { label: "Média (7d)", value: "media" },
              { label: "Baixa (14d)", value: "baixa" },
            ]}
          />
        }
      >
        <Table
          rowKey="id"
          size="small"
          loading={violationsQuery.isLoading}
          dataSource={rows}
          columns={columns}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: "Nenhuma violação ativa encontrada." }}
          rowClassName={(row) =>
            row.slaInfo.breached ? "ant-table-row-danger" : ""
          }
        />
      </Card>

      <StandardModal
        title="Atualizar status"
        description="Sinalize o avanço no tratamento da violação."
        open={Boolean(editing)}
        onCancel={() => setEditing(null)}
        onOk={() => {
          if (!editing?._nextStatus) return;
          updateMutation.mutate({ id: editing.id, payload: { status: editing._nextStatus } });
        }}
        confirmLoading={updateMutation.isPending}
      >
        {editing && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Text strong>{editing.title}</Text>
            <AgeBadge ageDays={editing.ageDays} slaInfo={editing.slaInfo} />
            <Select
              style={{ width: "100%" }}
              placeholder="Novo status"
              value={editing._nextStatus}
              onChange={(v) => setEditing((e) => ({ ...e, _nextStatus: v }))}
              options={[
                { label: "Em análise", value: "em_analise" },
                { label: "Resolvida", value: "resolvida" },
                { label: "Dispensada", value: "dispensada" },
              ]}
            />
          </Space>
        )}
      </StandardModal>
    </Space>
  );
}

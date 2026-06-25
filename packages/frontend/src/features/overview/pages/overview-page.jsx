import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Col, Row, Select, Space, Statistic, Table, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { getReportKpis, listAuditLogs } from "../../../bff-client";
import { useSession } from "../../auth/context/session-context";
import { OVERVIEW_FILTER_URL_SCHEMA } from "../overview-url-state-schema";
import { useUrlState } from "../../../shared/hooks/use-url-state";
import { PageHeader } from "../../../shared/ui/page-header";
import { toReadableDate, toRelativeTime } from "../../../shared/utils/formatters";
import { WorkflowPanel } from "../../../shared/ui/workflow-panel";

const PIE_COLORS = ["#ff4d4f", "#fa8c16", "#1677ff", "#52c41a"];

const { Text } = Typography;

const PERIOD_OPTIONS = [
  { label: "24 horas", value: "24h" },
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
];

const RISK_LEVEL_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Critical", value: "critical" },
];

const VIOLATION_STATUS_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Aberta", value: "aberta" },
  { label: "Resolvida", value: "resolvida" },
  { label: "Dispensada", value: "dispensada" },
];

export function OverviewPage() {
  const navigate = useNavigate();
  const [initialFilters, updateInitialFilters] = useUrlState(OVERVIEW_FILTER_URL_SCHEMA);
  const { hasAnyPermission } = useSession();
  const [filters, setFilters] = useState({
    period: initialFilters.period,
    area: initialFilters.area,
    eventType: initialFilters.eventType,
    riskLevel: initialFilters.riskLevel,
    violationStatus: initialFilters.violationStatus,
  });

  const updateFilters = (updater) => {
    setFilters((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      updateInitialFilters(next);
      return next;
    });
  };

  const canReadKpis = hasAnyPermission(["reports.read", "reports.export", "system.settings.manage"]);

  const kpisQuery = useQuery({
    queryKey: ["reports", "kpis", "overview", filters],
    queryFn: () =>
      getReportKpis({
        period: filters.period,
        area: filters.area || undefined,
        eventType: filters.eventType || undefined,
        riskLevel: filters.riskLevel || undefined,
        violationStatus: filters.violationStatus || undefined,
      }),
    enabled: canReadKpis,
  });

  const auditQuery = useQuery({
    queryKey: ["audit", "logs", "overview"],
    queryFn: () => listAuditLogs({ pageSize: 6 }),
    enabled: hasAnyPermission(["audit.logs.read.any", "audit.logs.read.scoped"]),
  });

  const stats = useMemo(() => {
    if (!kpisQuery.data) {
      return {
        events: 0,
        openViolations: 0,
        highCriticalRisk: 0,
        failedNotifications: 0,
      };
    }

    return {
      events: kpisQuery.data.totals.events,
      openViolations: kpisQuery.data.totals.violationsOpen,
      highCriticalRisk: kpisQuery.data.totals.riskHigh + kpisQuery.data.totals.riskCritical,
      failedNotifications: kpisQuery.data.totals.notificationsFailed,
    };
  }, [kpisQuery.data]);

  const exportQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set("scope", "violations");
    params.set("period", filters.period);
    if (filters.area) params.set("area", filters.area);
    if (filters.eventType) params.set("eventType", filters.eventType);
    if (filters.riskLevel) params.set("riskLevel", filters.riskLevel);
    if (filters.violationStatus) params.set("violationStatus", filters.violationStatus);
    return params.toString();
  }, [filters]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader
        title="Dashbord operacional"
        subtitle="Painel diário por função para leitura rápida, priorização e ação."
        actions={[
          <Button key="compliance" onClick={() => navigate("/compliance")}>Abrir compliance</Button>,
          <Button key="reports" onClick={() => navigate(`/reports?${exportQuery}`)}>Exportar com filtros</Button>,
          <Button key="admin" type="primary" onClick={() => navigate("/admin")}>Abrir administração</Button>,
        ]}
      />
      <WorkflowPanel
        title="Ritmo operacional sugerido"
        steps={["Ler indicadores críticos", "Abrir módulos com maior desvio", "Executar ação corretiva e registrar decisão"]}
      />

      <Card title="Filtros de KPI" loading={kpisQuery.isLoading && !kpisQuery.data}>
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12} lg={8}>
            <Text className="form-helper">Período</Text>
            <Select
              style={{ width: "100%" }}
              options={PERIOD_OPTIONS}
              value={filters.period}
              onChange={(value) => updateFilters((current) => ({ ...current, period: value }))}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Text className="form-helper">Área</Text>
            <Select
              style={{ width: "100%" }}
              options={[
                { label: "Todas", value: "" },
                { label: "Finance", value: "finance" },
                { label: "HR", value: "hr" },
                { label: "Security", value: "security" },
              ]}
              value={filters.area}
              onChange={(value) => updateFilters((current) => ({ ...current, area: value }))}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Text className="form-helper">Tipo de evento</Text>
            <Select
              style={{ width: "100%" }}
              options={[
                { label: "Todos", value: "" },
                { label: "invoice_updated", value: "invoice_updated" },
                { label: "access_review", value: "access_review" },
                { label: "policy_violation", value: "policy_violation" },
              ]}
              value={filters.eventType}
              onChange={(value) => updateFilters((current) => ({ ...current, eventType: value }))}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Text className="form-helper">Risco</Text>
            <Select
              style={{ width: "100%" }}
              options={RISK_LEVEL_OPTIONS}
              value={filters.riskLevel}
              onChange={(value) => updateFilters((current) => ({ ...current, riskLevel: value }))}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Text className="form-helper">Status de violação</Text>
            <Select
              style={{ width: "100%" }}
              options={VIOLATION_STATUS_OPTIONS}
              value={filters.violationStatus}
              onChange={(value) => updateFilters((current) => ({ ...current, violationStatus: value }))}
            />
          </Col>
          {kpisQuery.data ? (
            <Col xs={24}>
              <Text type="secondary">Atualizado em {toReadableDate(kpisQuery.data.generatedAtUTC)}</Text>
            </Col>
          ) : null}
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card loading={kpisQuery.isLoading && !kpisQuery.data}><Statistic title="Eventos" value={stats.events} suffix="itens" /></Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={kpisQuery.isLoading && !kpisQuery.data}><Statistic title="Violações abertas" value={stats.openViolations} /></Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={kpisQuery.isLoading && !kpisQuery.data}><Statistic title="Risco alto/crítico" value={stats.highCriticalRisk} /></Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={kpisQuery.isLoading && !kpisQuery.data}><Statistic title="Notificações falhas" value={stats.failedNotifications} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Distribuição de KPIs" loading={kpisQuery.isLoading && !kpisQuery.data}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { name: "Eventos", valor: stats.events },
                { name: "Violações", valor: stats.openViolations },
                { name: "Risco alto/crít.", valor: stats.highCriticalRisk },
                { name: "Notif. falhas", valor: stats.failedNotifications },
              ]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="valor" fill="#1677ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Eventos por serviço (recentes)" loading={auditQuery.isLoading && !auditQuery.data}>
            {(() => {
              const items = auditQuery.data?.items ?? [];
              const byService = Object.entries(
                items.reduce((acc, e) => {
                  const key = e.sourceService ?? "desconhecido";
                  acc[key] = (acc[key] ?? 0) + 1;
                  return acc;
                }, {})
              ).map(([name, value]) => ({ name, value }));
              return byService.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byService} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {byService.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Text type="secondary">Sem eventos recentes para exibir.</Text>;
            })()}
          </Card>
        </Col>
      </Row>

      <Card title="Linha de auditoria recente">
        <Table
          size="small"
          rowKey={(row) => row.eventId}
          loading={auditQuery.isLoading}
          dataSource={auditQuery.data?.items ?? []}
          pagination={false}
          locale={{ emptyText: "Sem eventos recentes." }}
          columns={[
            { title: "Evento", dataIndex: "eventType", key: "eventType" },
            { title: "Serviço", dataIndex: "sourceService", key: "sourceService" },
            { title: "Quando", dataIndex: "occurredAtUTC", key: "occurredAtUTC", render: (value) => <Text type="secondary">{toRelativeTime(value)}</Text> },
          ]}
        />
      </Card>
    </Space>
  );
}

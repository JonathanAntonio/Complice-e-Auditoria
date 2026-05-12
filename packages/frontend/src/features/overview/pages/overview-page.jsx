import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Col, Row, Space, Statistic, Table, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import {
  listAuditLogs,
  listComplianceViolations,
  listNotificationLogs,
  listRiskScores,
} from "../../../bff-client";
import { useSession } from "../../auth/context/session-context";
import { PageHeader } from "../../../shared/ui/page-header";
import { toRelativeTime } from "../../../shared/utils/formatters";
import { WorkflowPanel } from "../../../shared/ui/workflow-panel";

const { Text } = Typography;

export function OverviewPage() {
  const navigate = useNavigate();
  const { hasPermission, hasAnyPermission } = useSession();

  const violationsQuery = useQuery({
    queryKey: ["compliance", "violations", "overview"],
    queryFn: listComplianceViolations,
    enabled: hasPermission("compliance.violations.read"),
  });

  const auditQuery = useQuery({
    queryKey: ["audit", "logs", "overview"],
    queryFn: () => listAuditLogs({ pageSize: 6 }),
    enabled: hasAnyPermission(["audit.logs.read.any", "audit.logs.read.scoped"]),
  });

  const riskQuery = useQuery({
    queryKey: ["risk", "scores", "overview"],
    queryFn: () => listRiskScores({}),
    enabled: hasAnyPermission(["reports.read", "reports.export"]),
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "logs", "overview"],
    queryFn: listNotificationLogs,
    enabled: hasAnyPermission(["reports.read", "reports.export", "system.settings.manage"]),
  });

  const highSeverityCount = useMemo(
    () => (violationsQuery.data ?? []).filter((item) => item.severity === "alta").length,
    [violationsQuery.data]
  );

  const highRiskCount = useMemo(
    () => (riskQuery.data?.items ?? []).filter((item) => item.level === "high" || item.level === "critical").length,
    [riskQuery.data?.items]
  );

  const failedNotifications = useMemo(
    () => (notificationsQuery.data?.items ?? []).filter((item) => item.status === "failed" || item.status === "dead_letter").length,
    [notificationsQuery.data?.items]
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader
        title="Cockpit operacional"
        subtitle="Painel diário por função para leitura rápida, priorização e ação."
        actions={[
          <Button key="compliance" onClick={() => navigate("/compliance")}>Abrir compliance</Button>,
          <Button key="admin" type="primary" onClick={() => navigate("/admin")}>Abrir administração</Button>,
        ]}
      />
      <WorkflowPanel
        title="Ritmo operacional sugerido"
        steps={["Ler indicadores críticos", "Abrir módulos com maior desvio", "Executar ação corretiva e registrar decisão"]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card><Statistic title="Violações" value={(violationsQuery.data ?? []).length} suffix="itens" /></Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card><Statistic title="Alta severidade" value={highSeverityCount} /></Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card><Statistic title="Risco alto/crítico" value={highRiskCount} /></Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card><Statistic title="Notificações falhas" value={failedNotifications} /></Card>
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

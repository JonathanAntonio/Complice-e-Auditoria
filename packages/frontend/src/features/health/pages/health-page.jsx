import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, Col, Row, Space, Statistic, Table, Tag, Typography } from "antd";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getBffHealth } from "../../../bff-client";
import { PageHeader } from "../../../shared/ui/page-header";
import { WorkflowPanel } from "../../../shared/ui/workflow-panel";
import { toReadableDate } from "../../../shared/utils/formatters";

const MAX_HISTORY = 20;

const { Text } = Typography;

const SERVICES = [
  { key: "bff-service", label: "BFF Service", description: "Gateway frontend-backend", direct: true },
  { key: "identity-service", label: "Identity Service", description: "Autenticação e autorização (IAM)", direct: false },
  { key: "compliance-service", label: "Compliance Service", description: "Violações e regras de compliance", direct: false },
  { key: "audit-service", label: "Audit Service", description: "Trilha de auditoria e retenção", direct: false },
  { key: "risk-analysis-service", label: "Risk Analysis Service", description: "Score de risco por entidade", direct: false },
  { key: "messaging-service", label: "Messaging Service", description: "Fluxo de mensageria e eventos", direct: false },
  { key: "reporting-service", label: "Reporting Service", description: "Exportação de relatórios e KPIs", direct: false },
  { key: "notification-service", label: "Notification Service", description: "Despacho e preferências de notificação", direct: false },
  { key: "integration-service", label: "Integration Service", description: "Publicação de eventos de integração", direct: false },
];

function StatusBadge({ status, loading }) {
  if (loading) return <Badge status="processing" text="Verificando..." />;
  if (status === "ok") return <Badge status="success" text="Operacional" />;
  return <Badge status="error" text="Indisponível" />;
}

export function HealthPage() {
  const [pingHistory, setPingHistory] = useState([]);
  const pingCountRef = useRef(0);

  const bffQuery = useQuery({
    queryKey: ["health", "bff"],
    queryFn: getBffHealth,
    refetchInterval: 30_000,
    retry: 1,
  });

  // Usa o timestamp mais recente entre sucesso e erro para evitar dupla entrada quando ambos mudam juntos
  const lastSettledAt = Math.max(bffQuery.dataUpdatedAt ?? 0, bffQuery.errorUpdatedAt ?? 0);
  useEffect(() => {
    if (lastSettledAt === 0 || bffQuery.isFetching) return;
    const status = bffQuery.isError ? 0 : 1;
    const seq = ++pingCountRef.current;
    setPingHistory((prev) => [
      ...prev.slice(-(MAX_HISTORY - 1)),
      { label: `#${seq}`, status, time: new Date().toLocaleTimeString("pt-BR") },
    ]);
  }, [lastSettledAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const bffStatus = bffQuery.isError ? "error" : bffQuery.data?.status ?? null;
  const operationalCount = bffStatus === "ok" ? SERVICES.length : 0;
  const degradedCount = bffStatus === "error" ? SERVICES.length : 0;

  const columns = [
    {
      title: "Serviço",
      dataIndex: "label",
      key: "label",
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 180,
      render: (_, record) => {
        if (record.direct) {
          return <StatusBadge status={bffStatus} loading={bffQuery.isLoading} />;
        }
        if (bffStatus === "ok") return <Badge status="success" text="Acessível via BFF" />;
        if (bffQuery.isLoading) return <Badge status="processing" text="Verificando..." />;
        return <Badge status="warning" text="BFF indisponível" />;
      },
    },
    {
      title: "Acesso",
      key: "access",
      width: 130,
      render: (_, record) =>
        record.direct
          ? <Tag color="blue">Direto</Tag>
          : <Tag>Via gateway</Tag>,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader
        title="Saúde da plataforma"
        subtitle="Visão rápida do estado operacional dos serviços que compõem a plataforma."
        actions={[
          <Button
            key="refresh"
            loading={bffQuery.isFetching}
            onClick={() => bffQuery.refetch()}
          >
            Atualizar
          </Button>,
        ]}
      />

      <WorkflowPanel
        title="Protocolo de verificação de saúde"
        steps={[
          "Verificar status do BFF (gateway principal)",
          "Confirmar acessibilidade dos serviços downstream",
          "Escalar incidente caso algum serviço esteja degradado",
        ]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Serviços operacionais"
              value={bffQuery.isLoading ? "-" : operationalCount}
              suffix={bffQuery.isLoading ? "" : `/ ${SERVICES.length}`}
              valueStyle={{ color: operationalCount === SERVICES.length ? "#52c41a" : "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Serviços degradados"
              value={bffQuery.isLoading ? "-" : degradedCount}
              valueStyle={{ color: degradedCount > 0 ? "#ff4d4f" : "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Última verificação"
              value={bffQuery.dataUpdatedAt ? toReadableDate(new Date(bffQuery.dataUpdatedAt).toISOString()) : "-"}
              valueStyle={{ fontSize: 14 }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Histórico de verificações do BFF (últimas 20)">
        {pingHistory.length === 0 ? (
          <Text type="secondary">Aguardando primeira verificação...</Text>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={pingHistory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis domain={[0, 1]} hide />
              <Tooltip formatter={(value) => [value === 1 ? "OK" : "Erro", "Status"]} />
              <Bar dataKey="status" radius={[3, 3, 0, 0]} maxBarSize={20}>
                {pingHistory.map((entry) => (
                  <Cell key={entry.label} fill={entry.status === 1 ? "#52c41a" : "#ff4d4f"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card
        title="Status dos serviços"
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            Atualização automática a cada 30s
          </Text>
        }
      >
        <Table
          rowKey="key"
          size="small"
          dataSource={SERVICES}
          columns={columns}
          pagination={false}
          loading={bffQuery.isLoading}
          locale={{ emptyText: "Nenhum serviço cadastrado." }}
        />
      </Card>

      {bffQuery.isError && (
        <Card>
          <Space direction="vertical">
            <Text type="danger" strong>BFF inacessível</Text>
            <Text type="secondary">{bffQuery.error?.message ?? "Erro desconhecido ao contatar o BFF."}</Text>
            <Text type="secondary">
              Todos os serviços downstream dependem do BFF. Verifique se o processo do BFF está em execução na porta 4000.
            </Text>
          </Space>
        </Card>
      )}
    </Space>
  );
}

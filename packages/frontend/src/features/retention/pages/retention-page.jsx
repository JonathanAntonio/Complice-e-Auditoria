import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Select, Space, Table } from "antd";
import { listAuditRetentionRuns, listComplianceRetentionRuns } from "../../../bff-client";
import { useSession } from "../../auth/context/session-context";
import { PageHeader } from "../../../shared/ui/page-header";
import { RetentionStatusTag } from "../../../shared/ui/status-tags";
import { toReadableDate } from "../../../shared/utils/formatters";

const STATUS_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "Executando", value: "running" },
  { label: "Sucesso", value: "success" },
  { label: "Falha", value: "failed" },
];

const columns = [
  { title: "Início", dataIndex: "startedAt", key: "startedAt", render: toReadableDate },
  { title: "Fim", dataIndex: "finishedAt", key: "finishedAt", render: (value) => (value ? toReadableDate(value) : "-") },
  { title: "Status", dataIndex: "status", key: "status", render: (value) => <RetentionStatusTag value={value} /> },
  { title: "Retenção (dias)", dataIndex: "retentionDays", key: "retentionDays" },
  { title: "Scanned", dataIndex: "scannedCount", key: "scannedCount" },
  { title: "Eligible", dataIndex: "eligibleCount", key: "eligibleCount" },
  { title: "Erro", dataIndex: "errorMessage", key: "errorMessage", render: (value) => value ?? "-" },
];

export function RetentionPage({ embedded = false }) {
  const { hasAnyPermission, hasPermission } = useSession();
  const canReadAudit = hasAnyPermission(["audit.logs.read.any", "audit.logs.read.scoped"]);
  const canReadCompliance = hasPermission("compliance.violations.read");

  const [auditState, setAuditState] = useState({ page: 1, pageSize: 10, status: "all" });
  const [complianceState, setComplianceState] = useState({ page: 1, pageSize: 10, status: "all" });

  const auditQuery = useQuery({
    queryKey: ["retention", "audit", auditState],
    queryFn: () => listAuditRetentionRuns({
      page: auditState.page,
      pageSize: auditState.pageSize,
      ...(auditState.status !== "all" ? { status: auditState.status } : {}),
    }),
    enabled: canReadAudit,
  });

  const complianceQuery = useQuery({
    queryKey: ["retention", "compliance", complianceState],
    queryFn: () => listComplianceRetentionRuns({
      page: complianceState.page,
      pageSize: complianceState.pageSize,
      ...(complianceState.status !== "all" ? { status: complianceState.status } : {}),
    }),
    enabled: canReadCompliance,
  });

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {!embedded ? (
        <PageHeader title="Retenção" subtitle="Execuções de retenção para auditoria e compliance." />
      ) : null}

      {canReadAudit ? (
        <Card
          title="Retenção de auditoria"
          extra={(
            <Select
              style={{ width: 150 }}
              value={auditState.status}
              options={STATUS_OPTIONS}
              onChange={(status) => setAuditState((current) => ({ ...current, status, page: 1 }))}
            />
          )}
        >
          <Table
            rowKey={(row) => row.id}
            loading={auditQuery.isLoading}
            dataSource={auditQuery.data?.items ?? []}
            columns={columns}
            scroll={{ x: 980 }}
            pagination={{
              current: auditQuery.data?.page ?? auditState.page,
              pageSize: auditQuery.data?.pageSize ?? auditState.pageSize,
              total: auditQuery.data?.total ?? 0,
              showSizeChanger: true,
            }}
            onChange={(pagination) => {
              setAuditState((current) => ({
                ...current,
                page: pagination.current ?? current.page,
                pageSize: pagination.pageSize ?? current.pageSize,
              }));
            }}
          />
        </Card>
      ) : null}

      {canReadCompliance ? (
        <Card
          title="Retenção de compliance"
          extra={(
            <Select
              style={{ width: 150 }}
              value={complianceState.status}
              options={STATUS_OPTIONS}
              onChange={(status) => setComplianceState((current) => ({ ...current, status, page: 1 }))}
            />
          )}
        >
          <Table
            rowKey={(row) => row.id}
            loading={complianceQuery.isLoading}
            dataSource={complianceQuery.data?.items ?? []}
            columns={columns}
            scroll={{ x: 980 }}
            pagination={{
              current: complianceQuery.data?.page ?? complianceState.page,
              pageSize: complianceQuery.data?.pageSize ?? complianceState.pageSize,
              total: complianceQuery.data?.total ?? 0,
              showSizeChanger: true,
            }}
            onChange={(pagination) => {
              setComplianceState((current) => ({
                ...current,
                page: pagination.current ?? current.page,
                pageSize: pagination.pageSize ?? current.pageSize,
              }));
            }}
          />
        </Card>
      ) : null}
    </Space>
  );
}

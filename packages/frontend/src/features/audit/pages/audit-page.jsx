import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Space, Table, Typography } from "antd";
import { listAuditLogs } from "../../../bff-client";
import { PageHeader } from "../../../shared/ui/page-header";
import { toReadableDate } from "../../../shared/utils/formatters";

const { Text } = Typography;

export function AuditPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const logsQuery = useQuery({
    queryKey: ["audit", "logs", page, pageSize],
    queryFn: () => listAuditLogs({ page, pageSize }),
  });

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader
        title="Auditoria"
        subtitle="Trilha de eventos por serviço, severidade, ator e correlação."
      />

      <Card>
        <Table
          rowKey={(row) => row.eventId}
          loading={logsQuery.isLoading}
          dataSource={logsQuery.data?.items ?? []}
          scroll={{ x: 980 }}
          pagination={{
            current: logsQuery.data?.page ?? page,
            pageSize: logsQuery.data?.pageSize ?? pageSize,
            total: logsQuery.data?.total ?? 0,
            showSizeChanger: true,
          }}
          onChange={(pagination) => {
            setPage(pagination.current ?? 1);
            setPageSize(pagination.pageSize ?? 20);
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

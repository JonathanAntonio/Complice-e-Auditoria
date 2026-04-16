import { Card, Space, Table, Typography } from "antd";
import { PageHeader } from "../../../shared/ui/page-header";
import { useSession } from "../../auth/context/session-context";

const { Text } = Typography;

export function TeamsPage() {
  const { session } = useSession();

  const permissions = Array.isArray(session?.permissions) ? session.permissions : [];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader
        title="Times e responsabilidades"
        subtitle="Contexto atual da sessão e permissões efetivas do usuário."
      />

      <Card title="Sessão atual">
        <Space direction="vertical">
          <Text><strong>Nome:</strong> {session?.name ?? "-"}</Text>
          <Text><strong>E-mail:</strong> {session?.email ?? "-"}</Text>
          <Text><strong>Role principal:</strong> {session?.primaryRole ?? "-"}</Text>
          <Text><strong>Roles:</strong> {(session?.roles ?? []).join(", ") || "-"}</Text>
        </Space>
      </Card>

      <Card title="Permissões no token">
        <Table
          size="small"
          rowKey={(row) => row}
          dataSource={permissions}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: "Sem permissões disponíveis." }}
          columns={[{ title: "Permission", dataIndex: "", key: "permission", render: (value) => value }]}
        />
      </Card>
    </Space>
  );
}

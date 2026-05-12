import { Card, Col, Row, Space, Statistic, Table, Typography } from "antd";
import { PageHeader } from "../../../shared/ui/page-header";
import { WorkflowPanel } from "../../../shared/ui/workflow-panel";
import { useSession } from "../../auth/context/session-context";

const { Text } = Typography;

export function TeamsPage() {
  const { session } = useSession();

  const permissions = Array.isArray(session?.permissions) ? session.permissions : [];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader
        title="Times e responsabilidades"
        subtitle="Visão funcional de identidade, papéis e permissões efetivas da sessão."
      />

      <WorkflowPanel
        title="Fluxo de governança de acesso"
        steps={["Validar identidade e papel principal", "Conferir escopo de papéis vinculados", "Auditar permissões efetivas do token"]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={8}>
          <Card><Statistic title="Papéis vinculados" value={(session?.roles ?? []).length} /></Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card><Statistic title="Permissões efetivas" value={permissions.length} /></Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card><Statistic title="Papel principal" value={session?.primaryRole ?? "-"} /></Card>
        </Col>
      </Row>

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
          columns={[{ title: "Permissão", dataIndex: "", key: "permission", render: (value) => value }]}
        />
      </Card>
    </Space>
  );
}

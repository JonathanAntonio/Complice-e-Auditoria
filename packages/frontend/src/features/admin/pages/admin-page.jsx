import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography, message } from "antd";
import {
  createAdminUser,
  deactivateAdminUser,
  getAdminUser,
  ingestRiskEvent,
  listAdminUsers,
  updateAdminUserRoles,
  updateAdminUserSecurity,
} from "../../../bff-client";
import { useSession } from "../../auth/context/session-context";
import { PageHeader } from "../../../shared/ui/page-header";
import { toReadableDate } from "../../../shared/utils/formatters";

const { Text } = Typography;

const USER_ROLE_OPTIONS = [
  { label: "Administrador", value: "administrador" },
  { label: "Compliance Officer", value: "compliance_officer" },
  { label: "Auditor Interno", value: "auditor_interno" },
  { label: "Auditor Externo", value: "auditor_externo" },
  { label: "Gestor", value: "gestor" },
  { label: "Visualizador", value: "visualizador" },
];

export function AdminPage() {
  const [messageApi, messageContextHolder] = message.useMessage();
  const queryClient = useQueryClient();
  const { hasPermission } = useSession();

  const canRead = hasPermission("users.read.any");
  const canCreate = hasPermission("users.create");
  const canRoles = hasPermission("roles.assign");
  const canSecurity = hasPermission("users.update");
  const canDeactivate = hasPermission("users.deactivate");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [createForm] = Form.useForm();
  const [rolesForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [riskIngestForm] = Form.useForm();
  const [createOpen, setCreateOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", page, pageSize, search],
    queryFn: () => listAdminUsers({ page, pageSize, ...(search.trim() ? { search: search.trim() } : {}) }),
    enabled: canRead,
  });

  const refreshList = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const createMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: async () => {
      setCreateOpen(false);
      createForm.resetFields();
      await refreshList();
      void messageApi.success("Usuário criado com sucesso.");
    },
    onError: (error) => {
      void messageApi.error(error instanceof Error ? error.message : "Falha ao criar usuário.");
    },
  });

  const rolesMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAdminUserRoles(id, payload),
    onSuccess: async () => {
      setRolesOpen(false);
      await refreshList();
      void messageApi.success("Cargos atualizados com sucesso.");
    },
    onError: (error) => {
      void messageApi.error(error instanceof Error ? error.message : "Falha ao atualizar cargos.");
    },
  });

  const securityMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAdminUserSecurity(id, payload),
    onSuccess: async () => {
      setSecurityOpen(false);
      await refreshList();
      void messageApi.success("Configurações de segurança atualizadas.");
    },
    onError: (error) => {
      void messageApi.error(error instanceof Error ? error.message : "Falha ao atualizar segurança.");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAdminUser,
    onSuccess: async () => {
      await refreshList();
      void messageApi.success("Usuário desativado.");
    },
    onError: (error) => {
      void messageApi.error(error instanceof Error ? error.message : "Falha ao desativar usuário.");
    },
  });

  const detailsMutation = useMutation({
    mutationFn: getAdminUser,
    onSuccess: (result) => {
      setSelectedUserDetails(result);
      setDetailsOpen(true);
    },
    onError: (error) => {
      void messageApi.error(error instanceof Error ? error.message : "Falha ao carregar detalhes.");
    },
  });

  const riskIngestMutation = useMutation({
    mutationFn: ingestRiskEvent,
    onSuccess: () => {
      riskIngestForm.resetFields();
      void messageApi.success("Evento de risco registrado.");
    },
    onError: (error) => {
      void messageApi.error(error instanceof Error ? error.message : "Falha ao registrar evento de risco.");
    },
  });

  const rows = useMemo(() => usersQuery.data?.items ?? [], [usersQuery.data?.items]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {messageContextHolder}
      <PageHeader
        title="Administração de usuários"
        subtitle="Criação, governança de cargos, segurança e desativação de contas."
        actions={canCreate ? [<Button key="new" type="primary" onClick={() => setCreateOpen(true)}>Novo usuário</Button>] : []}
      />

      {!canRead ? (
        <Alert type="info" showIcon message="Sem permissão para listar usuários" description="Necessário users.read.any para visualizar a grade administrativa." />
      ) : (
        <Card
          title="Usuários"
          extra={(
            <Space>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome/e-mail"
                style={{ width: 220 }}
              />
              <Button onClick={() => usersQuery.refetch()}>Buscar</Button>
            </Space>
          )}
        >
          <Table
            rowKey={(row) => row.id}
            loading={usersQuery.isLoading}
            dataSource={rows}
            scroll={{ x: 980 }}
            pagination={{
              current: usersQuery.data?.page ?? page,
              pageSize: usersQuery.data?.pageSize ?? pageSize,
              total: usersQuery.data?.total ?? 0,
              showSizeChanger: true,
            }}
            onChange={(pagination) => {
              setPage(pagination.current ?? 1);
              setPageSize(pagination.pageSize ?? 10);
            }}
            columns={[
              { title: "Nome", dataIndex: "name", key: "name" },
              { title: "E-mail", dataIndex: "email", key: "email" },
              { title: "Role principal", dataIndex: "primaryRole", key: "primaryRole", render: (value) => <Tag>{value}</Tag> },
              { title: "Ativo", dataIndex: "isActive", key: "isActive", render: (value) => <Tag color={value ? "green" : "red"}>{value ? "Ativo" : "Inativo"}</Tag> },
              {
                title: "Ações",
                key: "actions",
                render: (_, row) => (
                  <Space>
                    <Button size="small" onClick={() => detailsMutation.mutate(row.id)} loading={detailsMutation.isPending}>Detalhes</Button>
                    {canRoles ? (
                      <Button size="small" onClick={() => {
                        setSelectedUser(row);
                        rolesForm.setFieldsValue({ primaryRole: row.primaryRole, roles: row.roles });
                        setRolesOpen(true);
                      }}>Cargos</Button>
                    ) : null}
                    {canSecurity ? (
                      <Button size="small" onClick={() => {
                        setSelectedUser(row);
                        securityForm.setFieldsValue({ isActive: row.isActive, blockedUntil: "" });
                        setSecurityOpen(true);
                      }}>Segurança</Button>
                    ) : null}
                    {canDeactivate ? (
                      <Button danger size="small" loading={deactivateMutation.isPending} onClick={() => deactivateMutation.mutate(row.id)}>Desativar</Button>
                    ) : null}
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      )}

      <Modal
        title="Criar usuário"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{ name: "", email: "" }}
          onFinish={(values) => createMutation.mutate({ name: values.name.trim(), email: values.email.trim() })}
        >
          <Form.Item label="Nome" name="name" rules={[{ required: true }, { min: 3 }]}>
            <Input />
          </Form.Item>
          <Form.Item label="E-mail" name="email" rules={[{ required: true }, { type: "email" }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Editar cargos"
        open={rolesOpen}
        onCancel={() => setRolesOpen(false)}
        onOk={() => rolesForm.submit()}
        confirmLoading={rolesMutation.isPending}
      >
        <Form
          form={rolesForm}
          layout="vertical"
          onFinish={(values) => {
            if (!selectedUser) return;
            rolesMutation.mutate({ id: selectedUser.id, payload: { primaryRole: values.primaryRole, roles: values.roles } });
          }}
        >
          <Form.Item label="Cargo principal" name="primaryRole" rules={[{ required: true }]}>
            <Select options={USER_ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item label="Cargos vinculados" name="roles" rules={[{ required: true }]}>
            <Select mode="multiple" options={USER_ROLE_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Editar segurança"
        open={securityOpen}
        onCancel={() => setSecurityOpen(false)}
        onOk={() => securityForm.submit()}
        confirmLoading={securityMutation.isPending}
      >
        <Form
          form={securityForm}
          layout="vertical"
          onFinish={(values) => {
            if (!selectedUser) return;
            securityMutation.mutate({
              id: selectedUser.id,
              payload: {
                isActive: values.isActive,
                blockedUntil: typeof values.blockedUntil === "string" && values.blockedUntil.trim() ? values.blockedUntil.trim() : null,
              },
            });
          }}
        >
          <Form.Item label="Ativo" name="isActive" rules={[{ required: true }]}>
            <Select options={[{ label: "Ativo", value: true }, { label: "Inativo", value: false }]} />
          </Form.Item>
          <Form.Item label="Bloqueado até (ISO UTC)" name="blockedUntil">
            <Input placeholder="2026-12-31T23:59:59.000Z" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Detalhes do usuário"
        open={detailsOpen}
        onCancel={() => setDetailsOpen(false)}
        footer={<Button onClick={() => setDetailsOpen(false)}>Fechar</Button>}
      >
        {selectedUserDetails ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Text><strong>Nome:</strong> {selectedUserDetails.name}</Text>
            <Text><strong>E-mail:</strong> {selectedUserDetails.email}</Text>
            <Text><strong>ID:</strong> {selectedUserDetails.id}</Text>
            <Text><strong>Role principal:</strong> {selectedUserDetails.primaryRole}</Text>
            <Text><strong>Roles:</strong> {selectedUserDetails.roles.join(", ") || "-"}</Text>
            <Text><strong>Permissões:</strong> {selectedUserDetails.permissions.length}</Text>
            <Text><strong>Status:</strong> {selectedUserDetails.isActive ? "Ativo" : "Inativo"}</Text>
            <Text><strong>Criado em:</strong> {toReadableDate(selectedUserDetails.createdAt)}</Text>
          </Space>
        ) : null}
      </Modal>

      {hasPermission("system.settings.manage") ? (
        <Card title="Operações técnicas: ingestão manual de risco">
          <Form
            form={riskIngestForm}
            layout="vertical"
            initialValues={{ userId: "", area: "", processType: "", severity: "medium" }}
            onFinish={(values) => riskIngestMutation.mutate(values)}
          >
            <div className="form-grid form-grid-2">
              <Form.Item label="User ID" name="userId" rules={[{ required: true }]}>
                <Input placeholder="user-123" />
              </Form.Item>
              <Form.Item label="Área" name="area" rules={[{ required: true }]}>
                <Input placeholder="financeiro" />
              </Form.Item>
              <Form.Item label="Tipo de processo" name="processType" rules={[{ required: true }]}>
                <Input placeholder="aprovacao-pagamento" />
              </Form.Item>
              <Form.Item label="Severidade" name="severity" rules={[{ required: true }]}>
                <Select options={[{ label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" }, { label: "Critical", value: "critical" }]} />
              </Form.Item>
            </div>
            <div className="form-actions">
              <Button onClick={() => riskIngestForm.resetFields()}>Limpar</Button>
              <Button type="primary" htmlType="submit" loading={riskIngestMutation.isPending}>Registrar evento</Button>
            </div>
          </Form>
        </Card>
      ) : null}
    </Space>
  );
}

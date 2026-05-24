import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card, Form, Input, Popconfirm, Select, Space, Table, Tag, Typography, message } from "antd";
import {
  createAdminUser,
  deactivateAdminUser,
  getAdminUser,
  ingestRiskEvent,
  listAdminUsers,
  updateAdminUserRoles,
  updateAdminUserSecurity,
} from "../../../bff-client";
import { useUrlState } from "../../../shared/hooks/use-url-state";
import { useSession } from "../../auth/context/session-context";
import { PageHeader } from "../../../shared/ui/page-header";
import { toReadableDate } from "../../../shared/utils/formatters";
import { StandardModal } from "../../../shared/ui/standard-modal";
import { WorkflowPanel } from "../../../shared/ui/workflow-panel";

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

  const [listState, setListState] = useUrlState({
    page: { key: "page", defaultValue: 1, parse: (value) => Number(value) || 1, serialize: (value) => String(value) },
    pageSize: { key: "pageSize", defaultValue: 10, parse: (value) => Number(value) || 10, serialize: (value) => String(value) },
    query: { key: "q", defaultValue: "" },
  });
  const [page, setPage] = useState(listState.page);
  const [pageSize, setPageSize] = useState(listState.pageSize);
  const [searchInput, setSearchInput] = useState(listState.query);
  const [search, setSearch] = useState(listState.query);
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
  const [detailsLoadingId, setDetailsLoadingId] = useState(null);
  const [activateLoadingId, setActivateLoadingId] = useState(null);
  const [deactivateLoadingId, setDeactivateLoadingId] = useState(null);

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

  const activateMutation = useMutation({
    mutationFn: (id) => updateAdminUserSecurity(id, { isActive: true, blockedUntil: null }),
    onSuccess: async () => {
      await refreshList();
      void messageApi.success("Usuário ativado.");
    },
    onError: (error) => {
      void messageApi.error(error instanceof Error ? error.message : "Falha ao ativar usuário.");
    },
    onSettled: () => {
      setActivateLoadingId(null);
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
    onSettled: () => {
      setDeactivateLoadingId(null);
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
    onSettled: () => {
      setDetailsLoadingId(null);
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

  const applySearch = () => {
    const nextSearch = searchInput.trim();
    setPage(1);
    setSearch(nextSearch);
    setListState({ page: 1, pageSize, query: nextSearch });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {messageContextHolder}
      <PageHeader
        title="Administração de usuários"
        subtitle="Controle por função: cadastro, papéis, segurança e desativação com rastreabilidade."
        actions={canCreate ? [<Button key="new" type="primary" onClick={() => setCreateOpen(true)}>Novo usuário</Button>] : []}
      />
      <WorkflowPanel
        title="Fluxo administrativo"
        steps={["Cadastrar usuário e dados básicos", "Definir papéis e permissões", "Aplicar políticas de segurança e acompanhar status"]}
      />

      {!canRead ? (
        <Alert type="info" showIcon message="Sem permissão para listar usuários" description="Necessário users.read.any para visualizar a grade administrativa." />
      ) : (
        <Card
          title="Usuários"
          extra={(
            <Space>
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onPressEnter={applySearch}
                placeholder="Buscar por nome/e-mail"
                style={{ width: 220 }}
              />
              <Button onClick={applySearch}>Buscar</Button>
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
              const nextPage = pagination.current ?? 1;
              const nextPageSize = pagination.pageSize ?? 10;
              setPage(nextPage);
              setPageSize(nextPageSize);
              setListState({ page: nextPage, pageSize: nextPageSize, query: search });
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
                    <Button
                      size="small"
                      onClick={() => {
                        setDetailsLoadingId(row.id);
                        detailsMutation.mutate(row.id);
                      }}
                      loading={detailsLoadingId === row.id}
                    >
                      Detalhes
                    </Button>
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
                    {canSecurity && !row.isActive ? (
                      <Popconfirm
                        title="Ativar usuário?"
                        description="A conta voltará a ter acesso conforme permissões vigentes."
                        okText="Ativar"
                        cancelText="Cancelar"
                        onConfirm={() => {
                          setActivateLoadingId(row.id);
                          activateMutation.mutate(row.id);
                        }}
                      >
                        <Button
                          size="small"
                          type="primary"
                          loading={activateLoadingId === row.id}
                        >
                          Ativar
                        </Button>
                      </Popconfirm>
                    ) : null}
                    {canDeactivate && row.isActive ? (
                      <Popconfirm
                        title="Desativar usuário?"
                        description="A conta perderá acesso até ser reativada."
                        okText="Desativar"
                        cancelText="Cancelar"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => {
                          setDeactivateLoadingId(row.id);
                          deactivateMutation.mutate(row.id);
                        }}
                      >
                        <Button
                          danger
                          size="small"
                          loading={deactivateLoadingId === row.id}
                        >
                          Desativar
                        </Button>
                      </Popconfirm>
                    ) : null}
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      )}

      <StandardModal
        title="Criar usuário"
        description="Etapa de entrada: identidade mínima para iniciar governança de acesso."
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
      </StandardModal>

      <StandardModal
        title="Editar cargos"
        description="Defina papel principal e escopo de atuação do usuário."
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
      </StandardModal>

      <StandardModal
        title="Editar segurança"
        description="Ajuste estado de conta e bloqueio temporário quando necessário."
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
            if (values.isActive === false && !canDeactivate) {
              void messageApi.error("Seu perfil não pode desativar usuários.");
              return;
            }
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
            <Select
              options={[
                { label: "Ativo", value: true },
                { label: "Inativo", value: false, disabled: !canDeactivate },
              ]}
            />
          </Form.Item>
          <Form.Item label="Bloqueado até (ISO UTC)" name="blockedUntil">
            <Input placeholder="2026-12-31T23:59:59.000Z" />
          </Form.Item>
        </Form>
      </StandardModal>

      <StandardModal
        title="Detalhes do usuário"
        description="Visão consolidada para auditoria de acesso e governança."
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
      </StandardModal>

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

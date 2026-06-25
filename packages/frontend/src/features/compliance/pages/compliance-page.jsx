import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Select, Space, Table, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import {
  createComplianceViolation,
  listComplianceViolations,
  updateComplianceViolation,
} from "../../../bff-client";
import { useSession } from "../../auth/context/session-context";
import { PageHeader } from "../../../shared/ui/page-header";
import { SeverityTag } from "../../../shared/ui/status-tags";
import { toReadableDate } from "../../../shared/utils/formatters";
import { StandardModal } from "../../../shared/ui/standard-modal";
import { WorkflowPanel } from "../../../shared/ui/workflow-panel";

const { Text } = Typography;

function normalizeSeverity(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "baixa" || normalized === "low") return "baixa";
  if (normalized === "alta" || normalized === "high" || normalized === "critical") return "alta";
  return "media";
}

function normalizeStatus(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "em_analise") return "em_analise";
  if (normalized === "resolvida") return "resolvida";
  if (normalized === "dispensada") return "dispensada";
  return "aberta";
}

export function CompliancePage() {
  const navigate = useNavigate();
  const [messageApi, messageContextHolder] = message.useMessage();
  const { hasPermission } = useSession();
  const canCreate = hasPermission("compliance.violations.create");
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const violationsQuery = useQuery({
    queryKey: ["compliance", "violations"],
    queryFn: listComplianceViolations,
  });

  const createMutation = useMutation({
    mutationFn: createComplianceViolation,
    onSuccess: async () => {
      setCreateOpen(false);
      createForm.resetFields();
      await queryClient.invalidateQueries({ queryKey: ["compliance", "violations"] });
      void messageApi.success("Violação criada com sucesso.");
    },
    onError: (error) => {
      void messageApi.error(error instanceof Error ? error.message : "Falha ao criar violação.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateComplianceViolation(id, payload),
    onSuccess: async () => {
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["compliance", "violations"] });
      void messageApi.success("Violação atualizada com sucesso.");
    },
    onError: (error) => {
      void messageApi.error(error instanceof Error ? error.message : "Falha ao editar violação.");
    },
  });

  const rows = useMemo(() => violationsQuery.data ?? [], [violationsQuery.data]);

  useEffect(() => {
    if (!editing) return;

    editForm.setFieldsValue({
      title: typeof editing.title === "string" && editing.title.trim().length > 0
        ? editing.title
        : typeof editing.name === "string"
          ? editing.name
          : "",
      severity: normalizeSeverity(editing.severity),
      status: normalizeStatus(editing.status),
    });
  }, [editing, editForm]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {messageContextHolder}
      <PageHeader
        title="Compliance"
        subtitle="Gestão orientada por fluxo: registrar, priorizar, tratar e encerrar violações."
        actions={[
          <Button key="sla" onClick={() => navigate("/compliance/sla")}>Ver SLA</Button>,
          ...(canCreate ? [<Button key="new" type="primary" onClick={() => setCreateOpen(true)}>Nova violação</Button>] : []),
        ]}
      />
      <WorkflowPanel
        title="Fluxo de tratamento"
        description="Padronize o ciclo para aumentar previsibilidade e controle operacional."
        steps={["Registrar o desvio com severidade correta", "Avaliar status e owner de resposta", "Encerrar com rastreabilidade da decisão"]}
      />

      <Table
        rowKey={(row) => row.id}
        loading={violationsQuery.isLoading}
        dataSource={rows}
        locale={{ emptyText: "Nenhuma violação encontrada." }}
        columns={[
          { title: "ID", dataIndex: "id", key: "id", render: (value) => <Text strong>{value.slice(0, 8).toUpperCase()}</Text> },
          { title: "Título", dataIndex: "title", key: "title" },
          { title: "Severidade", dataIndex: "severity", key: "severity", render: (value) => <SeverityTag value={value} /> },
          { title: "Status", dataIndex: "status", key: "status" },
          { title: "Criada em", dataIndex: "createdAt", key: "createdAt", render: toReadableDate },
          {
            title: "Ações",
            key: "actions",
            render: (_, row) => (
              canCreate ? (
                <Button
                  size="small"
                  onClick={() => {
                    setEditing(row);
                  }}
                >
                  Editar
                </Button>
              ) : <Text type="secondary">Sem ação</Text>
            ),
          },
        ]}
      />

      <StandardModal
        title="Criar violação"
        description="Etapa 1 do fluxo: registre o desvio com dados mínimos padronizados."
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{ title: "", severity: "media" }}
          onFinish={(values) => createMutation.mutate({ title: values.title.trim(), severity: values.severity })}
        >
          <Form.Item label="Título" name="title" rules={[{ required: true }, { min: 3 }]}>
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item label="Severidade" name="severity" rules={[{ required: true }]}>
            <Select options={[{ label: "Baixa", value: "baixa" }, { label: "Média", value: "media" }, { label: "Alta", value: "alta" }]} />
          </Form.Item>
        </Form>
      </StandardModal>

      <StandardModal
        title="Editar violação"
        description="Atualize o tratamento conforme o avanço da investigação."
        open={Boolean(editing)}
        onCancel={() => setEditing(null)}
        onOk={() => editForm.submit()}
        confirmLoading={updateMutation.isPending}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (!editing) return;
            updateMutation.mutate({
              id: editing.id,
              payload: {
                title: values.title.trim(),
                severity: values.severity,
                status: values.status,
              },
            });
          }}
        >
          <Form.Item label="Título" name="title" rules={[{ required: true }, { min: 3 }]}>
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item label="Severidade" name="severity" rules={[{ required: true }]}>
            <Select options={[{ label: "Baixa", value: "baixa" }, { label: "Média", value: "media" }, { label: "Alta", value: "alta" }]} />
          </Form.Item>
          <Form.Item label="Status" name="status" rules={[{ required: true }]}>
            <Select options={[{ label: "Aberta", value: "aberta" }, { label: "Em análise", value: "em_analise" }, { label: "Resolvida", value: "resolvida" }, { label: "Dispensada", value: "dispensada" }]} />
          </Form.Item>
        </Form>
      </StandardModal>
    </Space>
  );
}

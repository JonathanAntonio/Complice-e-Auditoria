import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Progress,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  Activity,
  Bell,
  Building2,
  ChartNoAxesColumn,
  CheckCircle2,
  FileCheck2,
  Filter,
  FolderKanban,
  Gauge,
  Radar,
  Search,
  Shield,
  TriangleAlert,
  UserRound,
  Users,
} from "lucide-react";
import {
  clearAuthErrorFromQuery,
  createComplianceViolation,
  getCurrentUserSession,
  listAuditLogs,
  listComplianceViolations,
  logoutSession,
  readAuthErrorFromQuery,
  startGithubOAuth,
  startGoogleOAuth,
  updateComplianceViolation,
} from "./bff-client";

const { Title, Text, Paragraph } = Typography;

const WORKSPACE_ITEMS = [
  { key: "overview", icon: <ChartNoAxesColumn size={15} />, label: "Cockpit" },
  { key: "audits", icon: <FolderKanban size={15} />, label: "Auditoria" },
  { key: "findings", icon: <TriangleAlert size={15} />, label: "Achados" },
  { key: "teams", icon: <Users size={15} />, label: "Times" },
  { key: "reports", icon: <FileCheck2 size={15} />, label: "Relatórios" },
];

const EMPTY_RECENT_ITEMS = [];
const EMPTY_TIMELINE_ITEMS = [];
const SEVERITY_RANK = { baixa: 1, media: 2, alta: 3 };

function severityTag(value) {
  if (value === "Alta") return <Tag color="red">Alta</Tag>;
  if (value === "Média") return <Tag color="gold">Média</Tag>;
  return <Tag color="green">Baixa</Tag>;
}

function statusTag(value) {
  if (value === "Concluída") return <Tag color="green">Concluída</Tag>;
  if (value === "Em revisão") return <Tag color="cyan">Em revisão</Tag>;
  if (value === "Em execução") return <Tag color="gold">Em execução</Tag>;
  return <Tag color="blue">Planejamento</Tag>;
}

function extractSessionMeta(currentUser) {
  if (!currentUser || typeof currentUser !== "object") {
    return { displayName: "Usuário", primaryRole: null, email: null };
  }

  const userRecord = currentUser;
  const displayName = typeof userRecord.name === "string" && userRecord.name.trim()
    ? userRecord.name.trim()
    : "Usuário";
  const primaryRole = typeof userRecord.primaryRole === "string" && userRecord.primaryRole.trim()
    ? userRecord.primaryRole.trim()
    : null;
  const email = typeof userRecord.email === "string" && userRecord.email.trim()
    ? userRecord.email.trim()
    : null;

  return { displayName, primaryRole, email };
}

function hasSessionPermission(currentUser, permission) {
  if (!currentUser || typeof currentUser !== "object") return false;
  const permissions = Array.isArray(currentUser.permissions) ? currentUser.permissions : [];
  return permissions.includes(permission);
}

function mapViolationsToDashboardRows(payload, maxItems = 6) {
  if (!Array.isArray(payload)) return EMPTY_RECENT_ITEMS;

  const rows = payload
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const source = item;
      const name = typeof source.title === "string" && source.title.trim() ? source.title.trim() : "Sem título";
      const id = typeof source.id === "string" && source.id.trim() ? source.id.trim().slice(0, 8).toUpperCase() : null;
      const severityRaw = typeof source.severity === "string" ? source.severity.toLowerCase() : "media";

      if (!id) return null;

      const severity = severityRaw === "alta" ? "Alta" : severityRaw === "baixa" ? "Baixa" : "Média";
      const createdAt = typeof source.createdAt === "string" ? source.createdAt : null;

      return {
        key: source.id,
        id: `CMP-${id}`,
        title: name,
        status: typeof source.status === "string" ? toStatusLabel(source.status) : "Em execução",
        severity,
        createdAtLabel: createdAt ? toReadableDate(createdAt) : "Sem data",
      };
    })
    .filter(Boolean);

  if (rows.length === 0) return EMPTY_RECENT_ITEMS;
  return rows.slice(0, Math.max(1, maxItems));
}

function toCsvValue(value) {
  const text = `${value ?? ""}`.replace(/"/g, '""');
  return `"${text}"`;
}

function triggerCsvDownload(filename, headers, rows) {
  const lines = [headers.join(","), ...rows.map((row) => row.map(toCsvValue).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function toStatusLabel(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "concluida" || normalized === "concluída" || normalized === "resolvida") return "Concluída";
  if (normalized === "em_analise" || normalized === "em análise" || normalized === "em revisao" || normalized === "em revisão") return "Em revisão";
  if (normalized === "aberta" || normalized === "aberto" || normalized === "open") return "Em execução";
  return "Planejamento";
}

function toReadableDate(value) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(parsed));
}

function toRelativeTime(value) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "instante indefinido";

  const diffMs = Date.now() - parsed;
  const diffMinutes = Math.max(1, Math.floor(Math.abs(diffMs) / 60000));
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays} d`;
}

function iconForAuditItem(eventType, severity) {
  if (severity === "critical" || severity === "high") return <TriangleAlert size={14} />;
  if (typeof eventType === "string" && eventType.startsWith("identity.auth")) return <Shield size={14} />;
  if (typeof eventType === "string" && eventType.startsWith("integration.audit")) return <Activity size={14} />;
  return <CheckCircle2 size={14} />;
}

function mapAuditLogsToTimeline(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.items)) return EMPTY_TIMELINE_ITEMS;

  const source = payload.items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const eventId = typeof item.eventId === "string" ? item.eventId : null;
      const eventType = typeof item.eventType === "string" ? item.eventType : "evento";
      const occurredAt = typeof item.occurredAtUTC === "string" ? item.occurredAtUTC : null;
      const sourceService = typeof item.sourceService === "string" ? item.sourceService : "serviço";
      const severity = typeof item.severity === "string" ? item.severity : "medium";

      return {
        key: eventId ?? `${eventType}-${occurredAt ?? "unknown"}`,
        title: `${eventType} (${sourceService})`,
        time: occurredAt ? toRelativeTime(occurredAt) : "instante indefinido",
        icon: iconForAuditItem(eventType, severity),
      };
    })
    .filter(Boolean);

  return source.slice(0, 6);
}

const tableColumns = [
  {
    title: "ID da violação",
    dataIndex: "id",
    key: "id",
    render: (value) => <Text strong>{value}</Text>,
  },
  { title: "Título", dataIndex: "title", key: "title" },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (value) => statusTag(value),
  },
  {
    title: "Severidade",
    dataIndex: "severity",
    key: "severity",
    render: (value) => severityTag(value),
  },
  { title: "Criada em", dataIndex: "createdAtLabel", key: "createdAtLabel" },
];

function WorkspaceButton({ active, icon, label, onClick }) {
  return (
    <button className={`workspace-btn ${active ? "workspace-btn-active" : ""}`} onClick={onClick} type="button">
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Panel({ title, extra, className = "", children }) {
  return (
    <section className={`surface-panel ${className}`.trim()}>
      {(title || extra) ? (
        <header className="panel-header">
          <Text className="panel-heading">{title}</Text>
          {extra ? <div className="panel-extra">{extra}</div> : null}
        </header>
      ) : null}
      <div className="panel-content">{children}</div>
    </section>
  );
}

function MetricBlock({ title, value, suffix = "", helper, tone }) {
  return (
    <div className={`metric-block metric-${tone}`}>
      <Statistic title={title} value={value} suffix={suffix} />
      {helper ? <Text className="metric-helper">{helper}</Text> : null}
    </div>
  );
}

export function App() {
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [activeMenuKey, setActiveMenuKey] = useState("overview");
  const [sessionStatus, setSessionStatus] = useState("loading");
  const [currentUser, setCurrentUser] = useState(null);
  const [requestError, setRequestError] = useState(null);
  const [oauthFeedback, setOauthFeedback] = useState(null);
  const [logoutPending, setLogoutPending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [violationsLoading, setViolationsLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPending, setEditPending] = useState(false);
  const [violationsRaw, setViolationsRaw] = useState([]);
  const [auditTimeline, setAuditTimeline] = useState(EMPTY_TIMELINE_ITEMS);
  const [auditLogsRaw, setAuditLogsRaw] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedPeriodDays, setSelectedPeriodDays] = useState("30");
  const [selectedMinSeverity, setSelectedMinSeverity] = useState("baixa");
  const [selectedExportScope, setSelectedExportScope] = useState("violations");
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [editingViolationId, setEditingViolationId] = useState(null);

  const loadSession = useCallback(async () => {
    setSessionStatus("loading");
    setRequestError(null);

    try {
      const user = await getCurrentUserSession();
      setCurrentUser(user);
      setSessionStatus("authenticated");
    } catch (err) {
      setCurrentUser(null);
      setSessionStatus("unauthenticated");
      if (err instanceof Error && err.message !== "Não autenticado.") {
        setRequestError(err.message);
      }
    }
  }, []);

  const sessionMeta = useMemo(() => extractSessionMeta(currentUser), [currentUser]);
  const sessionOnline = sessionStatus === "authenticated";
  const sessionLoading = sessionStatus === "loading";
  const canReadViolations = useMemo(
    () => hasSessionPermission(currentUser, "compliance.violations.read"),
    [currentUser]
  );
  const canCreateViolations = useMemo(
    () => hasSessionPermission(currentUser, "compliance.violations.create"),
    [currentUser]
  );
  const canReadAuditLogs = useMemo(
    () => hasSessionPermission(currentUser, "audit.logs.read.any")
      || hasSessionPermission(currentUser, "audit.logs.read.scoped"),
    [currentUser]
  );

  const loadViolationsData = useCallback(async () => {
    if (!sessionOnline || !canReadViolations) {
      setViolationsRaw([]);
      return;
    }

    setViolationsLoading(true);
    try {
      const items = await listComplianceViolations();
      setViolationsRaw(items);
    } catch (err) {
      if (err instanceof Error) {
        setRequestError(err.message);
      }
      setViolationsRaw([]);
    } finally {
      setViolationsLoading(false);
    }
  }, [canReadViolations, sessionOnline]);

  const loadAuditTimelineData = useCallback(async () => {
    if (!sessionOnline || !canReadAuditLogs) {
      setAuditTimeline(EMPTY_TIMELINE_ITEMS);
      setAuditLogsRaw([]);
      return;
    }

    setAuditLoading(true);
    try {
      const logs = await listAuditLogs({ pageSize: 50 });
      setAuditLogsRaw(logs.items);
      setAuditTimeline(mapAuditLogsToTimeline(logs));
    } catch (err) {
      if (err instanceof Error) {
        setRequestError(err.message);
      }
      setAuditTimeline(EMPTY_TIMELINE_ITEMS);
      setAuditLogsRaw([]);
    } finally {
      setAuditLoading(false);
    }
  }, [canReadAuditLogs, sessionOnline]);

  useEffect(() => {
    const { authError, authProvider } = readAuthErrorFromQuery();
    if (authError) {
      setOauthFeedback({
        message: authError,
        provider: authProvider ? authProvider.toUpperCase() : null,
      });
      clearAuthErrorFromQuery();
    }
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!sessionOnline) {
      setViolationsRaw([]);
      setAuditTimeline(EMPTY_TIMELINE_ITEMS);
      setAuditLogsRaw([]);
      return;
    }

    void loadViolationsData();
    void loadAuditTimelineData();
  }, [sessionOnline, loadViolationsData, loadAuditTimelineData]);

  const handleLogout = useCallback(async () => {
    if (logoutPending) return;

    setLogoutPending(true);
    setRequestError(null);
    try {
      await logoutSession();
    } catch (err) {
      if (err instanceof Error) {
        setRequestError(err.message);
      }
    } finally {
      setCurrentUser(null);
      setSessionStatus("unauthenticated");
      setLogoutPending(false);
    }
  }, [logoutPending]);

  const handleCreateViolation = useCallback(async () => {
    if (createPending) return;

    try {
      const values = await createForm.validateFields();
      setCreatePending(true);

      await createComplianceViolation({
        title: values.title.trim(),
        severity: String(values.severity).trim().toLowerCase(),
      });

      messageApi.success("Violacao criada com sucesso.");
      setCreateModalOpen(false);
      createForm.resetFields();
      await loadViolationsData();
    } catch (err) {
      if (err instanceof Error) {
        setRequestError(err.message);
      }
    } finally {
      setCreatePending(false);
    }
  }, [createPending, createForm, loadViolationsData, messageApi]);

  const handleOpenEditModal = useCallback(() => {
    if (!selectedViolation) return;
    editForm.setFieldsValue({
      title: selectedViolation.title ?? "",
      severity: String(selectedViolation.severity ?? "media").toLowerCase(),
    });
    setEditingViolationId(selectedViolation.id);
    setEditModalOpen(true);
    setSelectedViolation(null);
  }, [editForm, selectedViolation]);

  const handleEditViolation = useCallback(async () => {
    if (editPending || !editingViolationId) return;

    try {
      const values = await editForm.validateFields();
      setEditPending(true);

      const updated = await updateComplianceViolation(editingViolationId, {
        title: values.title.trim(),
        severity: String(values.severity).trim().toLowerCase(),
      });

      setSelectedViolation(updated);
      setEditingViolationId(null);
      messageApi.success("Violação atualizada com sucesso.");
      setEditModalOpen(false);
      await loadViolationsData();
    } catch (err) {
      if (err instanceof Error) {
        setRequestError(err.message);
      }
    } finally {
      setEditPending(false);
    }
  }, [editForm, editPending, editingViolationId, loadViolationsData, messageApi]);

  const filteredViolationsRaw = useMemo(() => {
    const now = Date.now();
    const minRank = SEVERITY_RANK[selectedMinSeverity] ?? 1;
    const periodDaysInt = parseInt(selectedPeriodDays, 10);
    const hasPeriodFilter = Number.isInteger(periodDaysInt) && periodDaysInt > 0;
    const search = searchQuery.trim().toLowerCase();

    return violationsRaw.filter((item) => {
      if (!item || typeof item !== "object") return false;
      const severityRaw = typeof item.severity === "string" ? item.severity.toLowerCase() : "media";
      const rank = SEVERITY_RANK[severityRaw] ?? 2;
      if (rank < minRank) return false;

      if (hasPeriodFilter && typeof item.createdAt === "string") {
        const createdAt = Date.parse(item.createdAt);
        if (!Number.isNaN(createdAt)) {
          const diffDays = Math.floor((now - createdAt) / (24 * 60 * 60 * 1000));
          if (diffDays > periodDaysInt) return false;
        }
      }

      if (search) {
        const title = typeof item.title === "string" ? item.title.toLowerCase() : "";
        const id = typeof item.id === "string" ? item.id.toLowerCase() : "";
        if (!title.includes(search) && !id.includes(search)) return false;
      }

      return true;
    });
  }, [searchQuery, selectedMinSeverity, selectedPeriodDays, violationsRaw]);

  const recentViolations = useMemo(
    () => mapViolationsToDashboardRows(filteredViolationsRaw, 6),
    [filteredViolationsRaw]
  );

  const observedActors = useMemo(() => {
    const ids = auditLogsRaw.map((item) => item?.actorId).filter((item) => typeof item === "string" && item.length > 0);
    return new Set(ids).size;
  }, [auditLogsRaw]);

  const kpiData = useMemo(() => {
    const totalViolations = filteredViolationsRaw.length;
    const highSeverity = filteredViolationsRaw.filter((item) => item?.severity === "alta").length;
    const complianceHealthy = totalViolations === 0
      ? 100
      : Math.max(0, Math.round(((totalViolations - highSeverity) / totalViolations) * 100));

    return [
      {
        title: "Risco operacional",
        value: highSeverity,
        suffix: " casos",
        tone: "risk",
        helper: "achados críticos",
      },
      {
        title: "Volume ativo",
        value: totalViolations,
        suffix: " ocorrências",
        tone: "warn",
        helper: "itens em tratamento",
      },
      {
        title: "Cobertura",
        value: complianceHealthy,
        suffix: "%",
        tone: "success",
        helper: "compliance saudável",
      },
      {
        title: "Atores rastreados",
        value: observedActors,
        suffix: "",
        tone: "info",
        helper: "identidades monitoradas",
      },
    ];
  }, [filteredViolationsRaw, observedActors]);

  const pipelineData = useMemo(() => {
    const concluded = filteredViolationsRaw.filter((item) => item?.status === "concluida").length;
    const review = filteredViolationsRaw.filter((item) => item?.severity === "alta" && item?.status !== "concluida").length;
    const planning = filteredViolationsRaw.filter((item) => {
      const status = typeof item?.status === "string" ? item.status.toLowerCase().trim() : "";
      return status === "planejamento" || status === "planned" || status === "backlog";
    }).length;
    const execution = Math.max(filteredViolationsRaw.length - review - concluded - planning, 0);

    return [
      { stage: "Planejamento", total: planning, tone: "neutral" },
      { stage: "Execução", total: execution, tone: "warn" },
      { stage: "Revisão", total: review, tone: "risk" },
      { stage: "Concluídas", total: concluded, tone: "success" },
    ];
  }, [filteredViolationsRaw]);

  const slaData = useMemo(() => {
    const pending = filteredViolationsRaw.length;
    const atRisk = filteredViolationsRaw.filter((item) => item?.severity === "alta").length;
    const onTime = Math.max(pending - atRisk, 0);
    const percent = pending === 0 ? 100 : Math.round((onTime / pending) * 100);
    return { pending, atRisk, onTime, percent };
  }, [filteredViolationsRaw]);

  const allViolationsRows = useMemo(
    () => mapViolationsToDashboardRows(filteredViolationsRaw, 100),
    [filteredViolationsRaw]
  );

  const violationsBySeverity = useMemo(() => {
    const alta = filteredViolationsRaw.filter((item) => item?.severity === "alta").length;
    const media = filteredViolationsRaw.filter((item) => item?.severity === "media").length;
    const baixa = filteredViolationsRaw.filter((item) => item?.severity === "baixa").length;
    return { alta, media, baixa };
  }, [filteredViolationsRaw]);

  const sessionPermissionsCount = useMemo(
    () => (Array.isArray(currentUser?.permissions) ? currentUser.permissions.length : 0),
    [currentUser]
  );

  const selectedMenuLabel = useMemo(
    () => WORKSPACE_ITEMS.find((item) => item.key === activeMenuKey)?.label ?? "Cockpit",
    [activeMenuKey]
  );

  const tableCommonProps = {
    size: "middle",
    pagination: false,
    locale: { emptyText: "Nenhuma violação encontrada." },
    scroll: { x: 760 },
    onRow: (record) => ({
      onClick: () => {
        const match = filteredViolationsRaw.find((raw) => raw.id === record.key) ?? null;
        setSelectedViolation(match);
      },
      style: { cursor: "pointer" },
    }),
  };

  const renderOverviewScreen = () => (
    <section className="overview-grid">
      <section className="hero-section">
        <div className="mission-headline">
          <div>
            <Text className="eyebrow">Comando estratégico</Text>
            <Title level={2} className="mission-title">Situação corporativa em tempo real</Title>
            <Paragraph>
              Visão consolidada para decisões de risco, resposta operacional e conformidade. Sessão ativa para {sessionMeta.displayName}.
            </Paragraph>
          </div>
          <Space>
            <Button icon={<Filter size={14} />} onClick={() => setFiltersModalOpen(true)}>Ajustar filtros</Button>
            <Button type="primary" onClick={() => setExportModalOpen(true)}>Exportar leitura</Button>
          </Space>
        </div>

        <div className="pipeline-board">
          {pipelineData.map((item) => (
            <div key={item.stage} className={`pipeline-column pipeline-${item.tone}`}>
              <Text>{item.stage}</Text>
              <Title level={3}>{item.total}</Title>
            </div>
          ))}
        </div>
      </section>

      <Panel title="Ocorrências mais recentes" extra={<Button type="link" loading={violationsLoading} onClick={() => void loadViolationsData()}>Atualizar</Button>}>
        <Table columns={tableColumns} dataSource={recentViolations} {...tableCommonProps} />
      </Panel>
    </section>
  );

  const renderAuditsScreen = () => (
    <section className="screen-grid">
      <Panel
        title="Linha de auditoria"
        extra={<Button onClick={() => void loadAuditTimelineData()} loading={auditLoading}>Recarregar logs</Button>}
      >
        <Paragraph type="secondary">
          Use <Text code>eventId</Text> como identificador único e <Text code>correlationId</Text> apenas para rastrear a jornada distribuída.
        </Paragraph>

        <List
          loading={auditLoading}
          dataSource={auditTimeline}
          locale={{ emptyText: "Nenhum log recente disponível." }}
          renderItem={(item) => (
            <List.Item key={item.key}>
              <Flex justify="space-between" style={{ width: "100%" }} align="center" gap={10}>
                <Flex align="center" gap={10}>
                  <div className="timeline-icon">{item.icon}</div>
                  <Text strong>{item.title}</Text>
                </Flex>
                <Text type="secondary">{item.time}</Text>
              </Flex>
            </List.Item>
          )}
        />
      </Panel>

      <section className="stats-grid stats-grid-3">
        <MetricBlock tone="info" title="Eventos" value={auditLogsRaw.length} />
        <MetricBlock tone="neutral" title="Atores" value={observedActors} />
        <MetricBlock tone="risk" title="Alta criticidade" value={auditLogsRaw.filter((event) => event.severity === "high" || event.severity === "critical").length} />
      </section>
    </section>
  );

  const renderFindingsScreen = () => (
    <section className="screen-grid">
      <section className="stats-grid stats-grid-3">
        <MetricBlock tone="risk" title="Alta" value={violationsBySeverity.alta} />
        <MetricBlock tone="warn" title="Média" value={violationsBySeverity.media} />
        <MetricBlock tone="success" title="Baixa" value={violationsBySeverity.baixa} />
      </section>

      <Panel
        title="Backlog de violações"
        extra={(
          <Space>
            <Button onClick={() => setFiltersModalOpen(true)}>Filtrar</Button>
            <Button type="primary" disabled={!canCreateViolations} onClick={() => setCreateModalOpen(true)}>Nova violação</Button>
          </Space>
        )}
      >
        <Table columns={tableColumns} dataSource={allViolationsRows} {...tableCommonProps} />
      </Panel>
    </section>
  );

  const renderTeamsScreen = () => (
    <Panel title="Matriz de responsabilidade">
      <div className="identity-grid">
        <div className="identity-item"><Text type="secondary">Gestor ativo</Text><Text strong>{sessionMeta.displayName}</Text></div>
        <div className="identity-item"><Text type="secondary">Contato</Text><Text strong>{sessionMeta.email ?? "não informado"}</Text></div>
        <div className="identity-item"><Text type="secondary">Role principal</Text><Text strong>{sessionMeta.primaryRole ?? "não definido"}</Text></div>
        <div className="identity-item"><Text type="secondary">Permissões no token</Text><Text strong>{sessionPermissionsCount}</Text></div>
        <div className="identity-item"><Text type="secondary">Atores monitorados</Text><Text strong>{observedActors}</Text></div>
      </div>
      <Button onClick={() => setTeamModalOpen(true)} style={{ marginTop: 14 }}>Gerenciar equipe</Button>
    </Panel>
  );

  const renderReportsScreen = () => (
    <Panel title="Centro de relatórios">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Text>Violações no escopo atual: {filteredViolationsRaw.length}</Text>
        <Text>Eventos de auditoria carregados: {auditLogsRaw.length}</Text>
        <Text>Filtro textual: {searchQuery.trim() || "nenhum"}</Text>
        <Button type="primary" onClick={() => setExportModalOpen(true)}>Gerar exportação</Button>
      </Space>
    </Panel>
  );

  const renderActiveScreen = () => {
    if (activeMenuKey === "audits") return renderAuditsScreen();
    if (activeMenuKey === "findings") return renderFindingsScreen();
    if (activeMenuKey === "teams") return renderTeamsScreen();
    if (activeMenuKey === "reports") return renderReportsScreen();
    return renderOverviewScreen();
  };

  return (
    <div className="ops-shell">
      {messageContextHolder}

      <header className="ops-masthead">
        <div className="brand-stack">
          <div className="brand-glyph"><Building2 size={17} /></div>
          <div>
            <Text className="brand-name">Complice e Auditoria</Text>
            <Text className="brand-state">{sessionOnline ? `sessão ativa: ${sessionMeta.displayName}` : "sessão não autenticada"}</Text>
          </div>
        </div>

        <div className="masthead-actions">
          <Input
            className="search-field"
            prefix={<Search size={14} />}
            placeholder="Buscar por ID ou título"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            disabled={!sessionOnline}
          />

          <Badge count={sessionOnline ? violationsBySeverity.alta : 0}>
            <Button shape="circle" icon={<Bell size={15} />} disabled={!sessionOnline} />
          </Badge>

          {sessionOnline ? (
            <>
              <div className="session-badge">
                <Avatar size="small" icon={<UserRound size={14} />} />
                <div>
                  <Text strong>{sessionMeta.displayName}</Text>
                  <Text className="session-role">{sessionMeta.primaryRole ?? "perfil sem role"}</Text>
                </div>
              </div>
              <Button onClick={handleLogout} loading={logoutPending}>Sair</Button>
              <Button type="primary" disabled={!canCreateViolations} onClick={() => setCreateModalOpen(true)}>Nova violação</Button>
            </>
          ) : (
            <>
              <Button onClick={startGoogleOAuth} loading={sessionLoading}>Google</Button>
              <Button type="primary" onClick={startGithubOAuth} loading={sessionLoading}>GitHub</Button>
            </>
          )}
        </div>
      </header>

      <div className="ops-layout">
        <aside className="ops-left-panel">
          <Panel className="panel-compact" title="Workspaces">
            <Text className="panel-title">Workspaces</Text>
            <div className="workspace-list">
              {WORKSPACE_ITEMS.map((item) => (
                <WorkspaceButton
                  key={item.key}
                  active={activeMenuKey === item.key}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => setActiveMenuKey(item.key)}
                />
              ))}
            </div>
          </Panel>

          <Panel className="panel-compact" title="Saúde operacional">
            <Space direction="vertical" style={{ width: "100%" }}>
              <div className="gauge-line">
                <Text>Conformidade</Text>
                <Tag color="green">{sessionOnline ? `${slaData.percent}%` : "sem sessão"}</Tag>
              </div>
              <Progress percent={sessionOnline ? slaData.percent : 0} showInfo={false} strokeColor="#1c8f6c" />

              <div className="gauge-line">
                <Text>Risco de SLA</Text>
                <Tag color="red">{sessionOnline ? `${slaData.atRisk}/${slaData.pending}` : "0/0"}</Tag>
              </div>
              <Progress
                percent={sessionOnline && slaData.pending > 0 ? Math.round((slaData.atRisk / slaData.pending) * 100) : 0}
                showInfo={false}
                strokeColor="#d94a35"
              />
            </Space>
          </Panel>

          <Panel className="panel-compact">
            <Space>
              <Radar size={16} />
              <Text>{sessionOnline ? "BFF conectado e autenticado" : "BFF pronto, aguardando login"}</Text>
            </Space>
          </Panel>
        </aside>

        <main className="ops-main-panel">
          {oauthFeedback ? (
            <Alert
              type="error"
              showIcon
              className="notice"
              message={`Falha no login${oauthFeedback.provider ? ` (${oauthFeedback.provider})` : ""}`}
              description={oauthFeedback.message}
            />
          ) : null}

          {requestError ? (
            <Alert
              type="warning"
              showIcon
              className="notice"
              message="Falha de integração"
              description={requestError}
            />
          ) : null}

          {sessionOnline && !canReadViolations ? (
            <Alert
              type="info"
              showIcon
              className="notice"
              message="Sem permissão para leitura de violações"
              description="Seu token não possui compliance.violations.read. Renove a sessão para sincronizar permissões."
            />
          ) : null}

          {!sessionOnline ? (
            <section className="hero-section">
              <Text className="eyebrow">Acesso restrito</Text>
              <Title level={2} className="mission-title">Autentique para abrir o workspace {selectedMenuLabel}</Title>
              <Paragraph>As trilhas de auditoria e compliance ficam indisponíveis até login via BFF.</Paragraph>
              <Space>
                <Button onClick={startGoogleOAuth} loading={sessionLoading}>Entrar com Google</Button>
                <Button type="primary" onClick={startGithubOAuth} loading={sessionLoading}>Entrar com GitHub</Button>
                <Button onClick={() => void loadSession()} loading={sessionLoading}>Atualizar sessão</Button>
              </Space>
            </section>
          ) : (
            <>
              <section className="metric-strip">
                {kpiData.map((metric) => (
                  <MetricBlock
                    key={metric.title}
                    tone={metric.tone}
                    title={metric.title}
                    value={metric.value}
                    suffix={metric.suffix}
                    helper={metric.helper}
                  />
                ))}
              </section>

              {renderActiveScreen()}
            </>
          )}
        </main>

        <aside className="ops-right-panel">
          <Panel title="Fluxo ao vivo" extra={<Gauge size={16} />}>
            {sessionOnline ? (
              <List
                loading={auditLoading}
                dataSource={auditTimeline}
                locale={{ emptyText: "Nenhum log recente disponível." }}
                renderItem={(item) => (
                  <List.Item key={item.key}>
                    <Flex gap={10} align="start">
                      <div className="timeline-icon">{item.icon}</div>
                      <div>
                        <Text strong>{item.title}</Text>
                        <Paragraph>{item.time}</Paragraph>
                      </div>
                    </Flex>
                  </List.Item>
                )}
              />
            ) : (
              <Paragraph>Autentique para visualizar atividade contínua do ambiente.</Paragraph>
            )}
          </Panel>

          <Panel title="Decisões rápidas">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button block onClick={() => setFiltersModalOpen(true)} icon={<Filter size={14} />}>Refinar recorte</Button>
              <Button block onClick={() => setTeamModalOpen(true)} icon={<Users size={14} />}>Revisar responsáveis</Button>
              <Button block type="primary" onClick={() => setExportModalOpen(true)} icon={<FileCheck2 size={14} />}>Emitir relatório</Button>
            </Space>
          </Panel>
        </aside>
      </div>

      <Modal
        title="Criar violação de compliance"
        open={createModalOpen}
        onCancel={() => {
          if (createPending) return;
          setCreateModalOpen(false);
        }}
        onOk={() => void handleCreateViolation()}
        okText="Criar violação"
        confirmLoading={createPending}
        destroyOnHidden
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{ title: "", severity: "media" }}
        >
          <Form.Item
            label="Título"
            name="title"
            rules={[
              { required: true, message: "Informe o título da violação." },
              { min: 3, message: "Use ao menos 3 caracteres." },
            ]}
          >
            <Input placeholder="Ex.: Acesso indevido fora do horário" maxLength={120} />
          </Form.Item>

          <Form.Item
            label="Severidade"
            name="severity"
            rules={[
              { required: true, message: "Informe a severidade." },
            ]}
          >
            <Select
              options={[
                { label: "Baixa", value: "baixa" },
                { label: "Média", value: "media" },
                { label: "Alta", value: "alta" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Filtros do Dashboard"
        open={filtersModalOpen}
        onCancel={() => setFiltersModalOpen(false)}
        onOk={() => setFiltersModalOpen(false)}
        okText="Aplicar"
        destroyOnHidden
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text strong>Período</Text>
          <Select
            value={selectedPeriodDays}
            onChange={(value) => setSelectedPeriodDays(value)}
            options={[
              { label: "Últimos 7 dias", value: "7" },
              { label: "Últimos 30 dias", value: "30" },
              { label: "Últimos 90 dias", value: "90" },
              { label: "Sem limite", value: "0" },
            ]}
          />
          <Text strong>Severidade mínima</Text>
          <Select
            value={selectedMinSeverity}
            onChange={(value) => setSelectedMinSeverity(value)}
            options={[
              { label: "Baixa", value: "baixa" },
              { label: "Média", value: "media" },
              { label: "Alta", value: "alta" },
            ]}
          />
          <Text strong>Busca rápida</Text>
          <Input
            placeholder="ID da violação ou título"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </Space>
      </Modal>

      <Modal
        title="Gerenciar equipe"
        open={teamModalOpen}
        onCancel={() => setTeamModalOpen(false)}
        onOk={() => setTeamModalOpen(false)}
        okText="Salvar"
        destroyOnHidden
      >
        <Paragraph>Gestor atual: {sessionMeta.displayName}</Paragraph>
        <Paragraph>Atualize composição da equipe e responsáveis por área.</Paragraph>
      </Modal>

      <Modal
        title="Exportar relatórios"
        open={exportModalOpen}
        onCancel={() => setExportModalOpen(false)}
        onOk={() => {
          if (selectedExportScope === "violations") {
            triggerCsvDownload(
              "violations-report.csv",
              ["id", "title", "status", "severity", "createdAt"],
              filteredViolationsRaw.map((item) => [
                item.id ?? "",
                item.title ?? "",
                item.status ?? "",
                item.severity ?? "",
                item.createdAt ?? "",
              ])
            );
          } else {
            triggerCsvDownload(
              "audit-report.csv",
              ["idEventoAuditoria", "idCorrelacao", "tipoEvento", "severidade", "servicoOrigem", "ocorridoEmUTC", "idAtor"],
              auditLogsRaw.map((item) => [
                item.eventId ?? "",
                item.correlationId ?? "",
                item.eventType ?? "",
                item.severity ?? "",
                item.sourceService ?? "",
                item.occurredAtUTC ?? "",
                item.actorId ?? "",
              ])
            );
          }
          messageApi.success("Exportação concluída.");
          setExportModalOpen(false);
        }}
        okText="Exportar"
        destroyOnHidden
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text>Selecione o formato de exportação e o escopo do relatório.</Text>
          <Select
            value="csv"
            options={[
              { label: "CSV", value: "csv" },
            ]}
            disabled
          />
          <Select
            value={selectedExportScope}
            onChange={(value) => setSelectedExportScope(value)}
            options={[
              { label: "Violações (filtradas)", value: "violations" },
              { label: "Auditoria (logs carregados)", value: "audit" },
            ]}
          />
        </Space>
      </Modal>

      <Modal
        title="Detalhes da violação"
        open={Boolean(selectedViolation)}
        onCancel={() => setSelectedViolation(null)}
        footer={(
          <Space>
            <Button onClick={() => setSelectedViolation(null)}>Fechar</Button>
            <Button type="primary" onClick={handleOpenEditModal} disabled={!canCreateViolations}>Editar</Button>
          </Space>
        )}
        destroyOnHidden
      >
        {selectedViolation ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Text strong>{selectedViolation.title ?? "Sem título"}</Text>
            <Text>ID da violação: {selectedViolation.id}</Text>
            <Text>Status: {toStatusLabel(selectedViolation.status ?? "aberta")}</Text>
            <Text>Severidade: {String(selectedViolation.severity ?? "media")}</Text>
            <Text>Criada em: {toReadableDate(selectedViolation.createdAt ?? "")}</Text>
          </Space>
        ) : null}
      </Modal>

      <Modal
        title="Editar violação"
        open={editModalOpen}
        onCancel={() => {
          if (editPending) return;
          setEditModalOpen(false);
          setEditingViolationId(null);
        }}
        onOk={() => void handleEditViolation()}
        okText="Salvar alterações"
        confirmLoading={editPending}
        destroyOnHidden
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <Form.Item
            label="Título"
            name="title"
            rules={[
              { required: true, message: "Informe o título da violação." },
              { min: 3, message: "Use ao menos 3 caracteres." },
            ]}
          >
            <Input placeholder="Ex.: Acesso indevido fora do horário" maxLength={120} />
          </Form.Item>

          <Form.Item
            label="Severidade"
            name="severity"
            rules={[
              { required: true, message: "Informe a severidade." },
            ]}
          >
            <Select
              options={[
                { label: "Baixa", value: "baixa" },
                { label: "Média", value: "media" },
                { label: "Alta", value: "alta" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

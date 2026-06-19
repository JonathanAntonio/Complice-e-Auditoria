import {
  ChartNoAxesColumn,
  GitBranch,
  FileCheck2,
  FolderKanban,
  Gauge,
  Radar,
  TriangleAlert,
  UserCog,
  Users,
} from "lucide-react";

export const NAV_GROUPS = [
  {
    key: "operations",
    label: "Operação",
    items: [
      {
        key: "overview",
        label: "Dashboard",
        path: "/",
        icon: ChartNoAxesColumn,
        description: "Visão consolidada de compliance, auditoria e risco.",
        requiredAny: [],
      },
      {
        key: "compliance",
        label: "Compliance",
        path: "/compliance",
        icon: TriangleAlert,
        description: "Gestão de violações e ciclo de tratamento.",
        requiredAny: ["compliance.violations.read"],
      },
      {
        key: "audit",
        label: "Auditoria",
        path: "/audit",
        icon: FolderKanban,
        description: "Consulta e investigação de trilhas de auditoria.",
        requiredAny: ["audit.logs.read.any", "audit.logs.read.scoped"],
      },
      {
        key: "risk",
        label: "Risco",
        path: "/risk",
        icon: Radar,
        description: "Análise de score de risco e histórico por tenant.",
        requiredAny: ["risk.scores.read"],
      },
    ],
  },
  {
    key: "governance",
    label: "Governança",
    items: [
      {
        key: "operations",
        label: "Operações",
        path: "/operations",
        icon: FileCheck2,
        description: "Relatórios, retenção, notificações e integrações em uma única tela.",
        aliases: ["/reports", "/retention", "/notifications", "/integrations"],
        requiredAny: [
          "reports.read",
          "reports.export",
          "system.settings.manage",
          "audit.logs.read.any",
          "audit.logs.read.scoped",
          "compliance.violations.read",
        ],
      },
      {
        key: "messaging",
        label: "Mensageria",
        path: "/messaging",
        icon: GitBranch,
        description: "Visualização ponta a ponta do fluxo de mensageria e falhas.",
        requiredAny: ["audit.logs.read.any", "audit.logs.read.scoped", "reports.read", "reports.export", "system.settings.manage"],
      },
    ],
  },
  {
    key: "system",
    label: "Sistema",
    items: [
      {
        key: "admin",
        label: "Administração",
        path: "/admin",
        icon: UserCog,
        description: "Gestão de usuários, permissões e controles administrativos.",
        requiredAny: ["users.read.any", "users.create", "roles.assign", "users.update", "users.deactivate", "system.settings.manage"],
      },
      {
        key: "teams",
        label: "Time",
        path: "/teams",
        icon: Users,
        description: "Visibilidade da estrutura de times e responsáveis.",
        requiredAny: [],
      },
      {
        key: "health",
        label: "Saúde",
        path: "/health",
        icon: Gauge,
        description: "Visão rápida da saúde geral da plataforma.",
        requiredAny: [],
      },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    groupKey: group.key,
    groupLabel: group.label,
  })),
);

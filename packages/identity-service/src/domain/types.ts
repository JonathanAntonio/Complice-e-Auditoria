/**
 * Tipo canônico do provedor OAuth (usado em portas e repositórios).
 */
export type OAuthProvider = "google" | "github";

export const USER_ROLES = {
  ADMINISTRADOR: "administrador",
  COMPLIANCE_OFFICER: "compliance_officer",
  AUDITOR_INTERNO: "auditor_interno",
  AUDITOR_EXTERNO: "auditor_externo",
  GESTOR: "gestor",
  VISUALIZADOR: "visualizador",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const DEFAULT_USER_ROLE: UserRole = USER_ROLES.VISUALIZADOR;

export const USER_ROLE_VALUES = Object.values(USER_ROLES);

export const PERMISSIONS = {
  USERS_CREATE: "users.create",
  USERS_READ_SELF: "users.read.self",
  USERS_READ_ANY: "users.read.any",
  USERS_UPDATE: "users.update",
  USERS_DEACTIVATE: "users.deactivate",
  ROLES_ASSIGN: "roles.assign",
  ROLES_READ: "roles.read",
  AUDIT_LOGS_READ_ANY: "audit.logs.read.any",
  AUDIT_LOGS_READ_SCOPED: "audit.logs.read.scoped",
  COMPLIANCE_RULES_CREATE: "compliance.rules.create",
  COMPLIANCE_RULES_UPDATE: "compliance.rules.update",
  COMPLIANCE_RULES_DEACTIVATE: "compliance.rules.deactivate",
  DASHBOARD_READ: "dashboard.read",
  REPORTS_READ: "reports.read",
  REPORTS_EXPORT: "reports.export",
  INTEGRATIONS_READ: "integrations.read",
  INTEGRATIONS_MANAGE: "integrations.manage",
  SYSTEM_SETTINGS_MANAGE: "system.settings.manage",
  COMPLIANCE_VIOLATIONS_READ: "compliance.violations.read",
  COMPLIANCE_VIOLATIONS_CREATE: "compliance.violations.create",
  COMPLIANCE_TEST_ACCESS: "compliance.test.access",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_VALUES = Object.values(PERMISSIONS);

const ROLE_PERMISSION_MAP: Record<UserRole, Permission[]> = {
  [USER_ROLES.ADMINISTRADOR]: [
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ_SELF,
    PERMISSIONS.USERS_READ_ANY,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DEACTIVATE,
    PERMISSIONS.ROLES_ASSIGN,
    PERMISSIONS.ROLES_READ,
    PERMISSIONS.AUDIT_LOGS_READ_ANY,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.INTEGRATIONS_READ,
    PERMISSIONS.INTEGRATIONS_MANAGE,
    PERMISSIONS.SYSTEM_SETTINGS_MANAGE,
    PERMISSIONS.COMPLIANCE_VIOLATIONS_READ,
    PERMISSIONS.COMPLIANCE_VIOLATIONS_CREATE,
    PERMISSIONS.COMPLIANCE_TEST_ACCESS,
  ],
  [USER_ROLES.COMPLIANCE_OFFICER]: [
    PERMISSIONS.USERS_READ_SELF,
    PERMISSIONS.AUDIT_LOGS_READ_ANY,
    PERMISSIONS.COMPLIANCE_RULES_CREATE,
    PERMISSIONS.COMPLIANCE_RULES_UPDATE,
    PERMISSIONS.COMPLIANCE_RULES_DEACTIVATE,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.COMPLIANCE_VIOLATIONS_READ,
  ],
  [USER_ROLES.AUDITOR_INTERNO]: [
    PERMISSIONS.USERS_READ_SELF,
    PERMISSIONS.AUDIT_LOGS_READ_ANY,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.COMPLIANCE_VIOLATIONS_READ,
  ],
  [USER_ROLES.AUDITOR_EXTERNO]: [
    PERMISSIONS.USERS_READ_SELF,
    PERMISSIONS.AUDIT_LOGS_READ_SCOPED,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.COMPLIANCE_VIOLATIONS_READ,
  ],
  [USER_ROLES.GESTOR]: [
    PERMISSIONS.USERS_READ_SELF,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.COMPLIANCE_VIOLATIONS_READ,
    PERMISSIONS.COMPLIANCE_VIOLATIONS_CREATE,
    PERMISSIONS.COMPLIANCE_TEST_ACCESS,
  ],
  [USER_ROLES.VISUALIZADOR]: [
    PERMISSIONS.USERS_READ_SELF,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.COMPLIANCE_VIOLATIONS_READ,
  ],
};

export function permissionsForRole(role: UserRole): Permission[] {
  return [...ROLE_PERMISSION_MAP[role]];
}

export function permissionsForRoles(roles: UserRole[]): Permission[] {
  const granted = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSION_MAP[role]) {
      granted.add(permission);
    }
  }

  return PERMISSION_VALUES.filter((permission) => granted.has(permission as Permission)) as Permission[];
}

export function uniqueRoles(roles: UserRole[]): UserRole[] {
  const seen = new Set<UserRole>();
  const unique: UserRole[] = [];
  for (const role of roles) {
    if (!seen.has(role)) {
      seen.add(role);
      unique.push(role);
    }
  }
  return unique;
}

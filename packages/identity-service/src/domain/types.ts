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

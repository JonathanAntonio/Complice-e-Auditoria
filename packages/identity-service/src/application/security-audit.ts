import type { OutboxEvent } from "./ports/outbox-writer.port";

export interface SecurityAuditContext {
  ipAddress?: string;
  requestId?: string;
  userAgent?: string;
}

export const SECURITY_AUDIT_EVENTS = {
  LOGIN_SUCCEEDED: "identity.auth.login_succeeded",
  LOGIN_FAILED: "identity.auth.login_failed",
  LOGOUT: "identity.auth.logout",
  ACCOUNT_LOCKED: "identity.auth.account_locked",
  ACCESS_DENIED: "identity.auth.access_denied",
  ROLE_CHANGED: "identity.auth.role_changed",
  USER_SECURITY_CHANGED: "identity.auth.user_security_changed",
  USER_DEACTIVATED: "identity.auth.user_deactivated",
} as const;

export type SecurityAuditEventName =
  (typeof SECURITY_AUDIT_EVENTS)[keyof typeof SECURITY_AUDIT_EVENTS];

type SecurityAuditPayload = Record<string, unknown> & {
  occurredAt?: unknown;
};

export function createSecurityAuditEvent(
  eventName: SecurityAuditEventName,
  payload: SecurityAuditPayload
): OutboxEvent {
  const occurredAt =
    typeof payload.occurredAt === "string" && payload.occurredAt.length > 0
      ? payload.occurredAt
      : new Date().toISOString();

  return {
    eventName,
    payload: {
      ...payload,
      occurredAt,
    },
  };
}

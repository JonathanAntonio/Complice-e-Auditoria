import type { OutboxEvent } from "./ports/outbox-writer.port";

export interface SecurityAuditContext {
  ipAddress?: string;
  requestId?: string;
  userAgent?: string;
}

export const SECURITY_AUDIT_EVENTS = {
  LOGIN_SUCCEEDED: "identity.auth.login_succeeded",
  LOGIN_FAILED: "identity.auth.login_failed",
  ACCOUNT_LOCKED: "identity.auth.account_locked",
  ACCESS_DENIED: "identity.auth.access_denied",
} as const;

export function createSecurityAuditEvent(
  eventName: string,
  payload: Record<string, unknown>
): OutboxEvent {
  return {
    eventName,
    payload: {
      ...payload,
      occurredAt: new Date().toISOString(),
    },
  };
}

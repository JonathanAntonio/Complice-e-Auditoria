import type { IOutboxRepository } from "../ports/outbox-repository.port";
import {
  createSecurityAuditEvent,
  type SecurityAuditContext,
  SECURITY_AUDIT_EVENTS,
} from "../security-audit";

export class LogoutUseCase {
  constructor(private readonly outboxRepository: IOutboxRepository) {}

  async execute(userId: string, auditContext: SecurityAuditContext = {}): Promise<void> {
    await this.outboxRepository.append(
      createSecurityAuditEvent(SECURITY_AUDIT_EVENTS.LOGOUT, {
        userId,
        ipAddress: auditContext.ipAddress,
        requestId: auditContext.requestId,
        userAgent: auditContext.userAgent,
      })
    );
  }
}

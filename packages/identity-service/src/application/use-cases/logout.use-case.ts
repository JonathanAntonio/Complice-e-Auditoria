import type { IOutboxRepository } from "../ports/outbox-repository.port";
import type { IUserRepository } from "../ports/user-repository.port";
import {
  createSecurityAuditEvent,
  type SecurityAuditContext,
  SECURITY_AUDIT_EVENTS,
} from "../security-audit";
import { InvalidSessionError } from "../errors";

export class LogoutUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    _outboxRepository: IOutboxRepository
  ) {}

  async execute(userId: string, authzVersion: number | undefined, auditContext: SecurityAuditContext = {}): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new InvalidSessionError("User not found");
    }
    if (typeof authzVersion === "number" && authzVersion !== user.authorizationVersion) {
      throw new InvalidSessionError("Session version mismatch");
    }

    user.invalidateSessions();

    await this.userRepository.saveUserAndOutbox(
      user,
      createSecurityAuditEvent(SECURITY_AUDIT_EVENTS.LOGOUT, {
        userId,
        authzVersion: user.authorizationVersion,
        ipAddress: auditContext.ipAddress,
        requestId: auditContext.requestId,
        correlationId: auditContext.correlationId ?? auditContext.requestId,
        userAgent: auditContext.userAgent,
      })
    );
  }
}

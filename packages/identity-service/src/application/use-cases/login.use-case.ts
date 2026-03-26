import type { IUserRepository } from "../ports/user-repository.port";
import type { IAuthCredentialRepository } from "../ports/auth-credential-repository.port";
import type { IOutboxRepository } from "../ports/outbox-repository.port";
import type { IPasswordHasher } from "../ports/password-hasher.port";
import type { ITokenService } from "../ports/token-service.port";
import type { LoginDto } from "../dtos/login.dto";
import type { AuthUserDto } from "../dtos/auth-response.dto";
import { AccountLockedError, InvalidCredentialsError, UserInactiveError } from "../errors";
import {
  createSecurityAuditEvent,
  type SecurityAuditEventName,
  type SecurityAuditContext,
  SECURITY_AUDIT_EVENTS,
} from "../security-audit";
import { logger } from "@lframework/shared";
import { toAuthUserDto } from "../dtos/user-profile.mapper";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_DURATION_MS = 15 * 60 * 1000;

export interface LoginResultDto {
  user: AuthUserDto;
  accessToken: string;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authCredentialRepository: IAuthCredentialRepository,
    private readonly outboxRepository: IOutboxRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  async execute(dto: LoginDto, auditContext: SecurityAuditContext = {}): Promise<LoginResultDto> {
    const baseAuditPayload = {
      email: dto.email,
      ipAddress: auditContext.ipAddress,
      requestId: auditContext.requestId,
      userAgent: auditContext.userAgent,
    };
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      await this.appendAuditEventSafely(
        SECURITY_AUDIT_EVENTS.LOGIN_FAILED,
        {
          ...baseAuditPayload,
          reason: "invalid_credentials",
        },
        auditContext.requestId
      );
      throw new InvalidCredentialsError("Invalid email or password");
    }

    if (!user.isActive) {
      await this.appendAuditEventSafely(
        SECURITY_AUDIT_EVENTS.LOGIN_FAILED,
        {
          ...baseAuditPayload,
          userId: user.id,
          reason: "inactive_user",
        },
        auditContext.requestId
      );
      throw new UserInactiveError("User is inactive");
    }

    const now = new Date();
    if (user.isBlocked(now)) {
      await this.appendAuditEventSafely(
        SECURITY_AUDIT_EVENTS.ACCOUNT_LOCKED,
        {
          ...baseAuditPayload,
          userId: user.id,
          blockedUntil: user.blockedUntil?.toISOString(),
          reason: "account_locked",
        },
        auditContext.requestId
      );
      throw new AccountLockedError();
    }

    const hash = await this.authCredentialRepository.getPasswordHashByUserId(user.id);
    if (!hash) {
      throw new InvalidCredentialsError("Invalid email or password");
    }

    const valid = await this.passwordHasher.verify(dto.password, hash);
    if (!valid) {
      user.recordFailedLogin(now, MAX_FAILED_LOGIN_ATTEMPTS, ACCOUNT_LOCK_DURATION_MS);
      const locked = user.isBlocked(now);
      await this.userRepository.saveUserAndOutbox(
        user,
        createSecurityAuditEvent(
          locked ? SECURITY_AUDIT_EVENTS.ACCOUNT_LOCKED : SECURITY_AUDIT_EVENTS.LOGIN_FAILED,
          {
            ...baseAuditPayload,
            userId: user.id,
            failedLoginAttempts: user.failedLoginAttempts,
            blockedUntil: user.blockedUntil?.toISOString(),
            reason: locked ? "too_many_attempts" : "invalid_credentials",
          }
        )
      );
      if (locked) {
        throw new AccountLockedError();
      }
      throw new InvalidCredentialsError("Invalid email or password");
    }

    user.recordSuccessfulLogin();
    await this.userRepository.saveUserAndOutbox(
      user,
      createSecurityAuditEvent(SECURITY_AUDIT_EVENTS.LOGIN_SUCCEEDED, {
        ...baseAuditPayload,
        userId: user.id,
        primaryRole: user.primaryRole,
        roles: user.roles,
        permissions: user.permissions,
        authzVersion: user.authorizationVersion,
      })
    );

    const accessToken = this.tokenService.sign({
      sub: user.id,
      email: user.email.value,
      primaryRole: user.primaryRole,
      roles: user.roles,
      permissions: user.permissions,
      authzVersion: user.authorizationVersion,
    });

    return {
      user: toAuthUserDto(user),
      accessToken,
    };
  }

  private async appendAuditEventSafely(
    eventName: SecurityAuditEventName,
    payload: Record<string, unknown>,
    requestId?: string
  ): Promise<void> {
    try {
      await this.outboxRepository.append(createSecurityAuditEvent(eventName, payload));
    } catch (err) {
      logger.error({ err, eventName, requestId }, "Failed to append login audit event");
    }
  }
}

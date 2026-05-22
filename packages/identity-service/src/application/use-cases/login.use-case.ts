import {
  AccountLockedError,
  InvalidCredentialsError,
  UserInactiveError,
} from "../errors";
import type { IUserRepository } from "../ports/user-repository.port";
import type { IPasswordHasher } from "../ports/password-hasher.port";
import type { ITokenService } from "../ports/token-service.port";
import type { IOutboxRepository } from "../ports/outbox-repository.port";
import {
  createSecurityAuditEvent,
  type SecurityAuditEventName,
  type SecurityAuditContext,
  SECURITY_AUDIT_EVENTS,
} from "../security-audit";
import { logger } from "@lframework/shared";
import { toAuthUserDto } from "../dtos/user-profile.mapper";
import type { UserAuthProfileDto } from "../dtos/user-auth-profile.dto";
import type { User } from "../../domain/entities/user.entity";

export interface LoginInputDto {
  email: string;
  password?: string;
}

export interface LoginResultDto {
  user: UserAuthProfileDto;
  accessToken: string;
}

export interface LoginUseCaseOptions {
  failClosedAudit?: boolean;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly outboxRepository: IOutboxRepository,
    private readonly options: LoginUseCaseOptions = {}
  ) {}

  async execute(
    input: LoginInputDto,
    auditContext: SecurityAuditContext = {}
  ): Promise<LoginResultDto> {
    const { email, password } = input;

    const baseAuditPayload = {
      authMethod: "password",
      email,
      ipAddress: auditContext.ipAddress,
      requestId: auditContext.requestId,
      correlationId: auditContext.correlationId ?? auditContext.requestId,
      userAgent: auditContext.userAgent,
    };

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      await this.appendAuditEventSafely(
        SECURITY_AUDIT_EVENTS.LOGIN_FAILED,
        { ...baseAuditPayload, reason: "user_not_found" },
        "user_not_found"
      );
      throw new InvalidCredentialsError();
    }

    if (!user.isActive) {
      await this.appendAuditEventSafely(
        SECURITY_AUDIT_EVENTS.LOGIN_FAILED,
        { ...baseAuditPayload, userId: user.id, reason: "inactive_user" },
        "inactive_user"
      );
      throw new UserInactiveError();
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
        "account_locked"
      );
      throw new AccountLockedError();
    }

    if (!user.passwordHash || !password) {
      // Se usuário não tem senha (ex: só OAuth) ou não enviou senha
      await this.handleFailedAttempt(user, baseAuditPayload, "missing_password");
      throw new InvalidCredentialsError();
    }

    const isPasswordCorrect = await this.passwordHasher.compare(password, user.passwordHash);

    if (!isPasswordCorrect) {
      await this.handleFailedAttempt(user, baseAuditPayload, "invalid_password");
      throw new InvalidCredentialsError();
    }

    // Sucesso
    user.recordSuccessfulLogin();
    user.invalidateSessions(); // Rotaciona versão de autorização por segurança
    await this.userRepository.save(user);

    await this.appendAuditEventSafely(
      SECURITY_AUDIT_EVENTS.LOGIN_SUCCEEDED,
      {
        ...baseAuditPayload,
        userId: user.id,
        primaryRole: user.primaryRole,
        roles: user.roles,
        permissions: user.permissions,
        authzVersion: user.authorizationVersion,
      },
      "login_succeeded"
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

  private async handleFailedAttempt(
    user: User,
    baseAuditPayload: Record<string, unknown>,
    reason: string
  ): Promise<void> {
    const now = new Date();
    user.recordFailedLogin(now, MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION_MS);
    await this.userRepository.save(user);

    if (user.isBlocked(now)) {
      await this.appendAuditEventSafely(
        SECURITY_AUDIT_EVENTS.ACCOUNT_LOCKED,
        {
          ...baseAuditPayload,
          userId: user.id,
          blockedUntil: user.blockedUntil?.toISOString(),
          reason: "max_attempts_reached",
          notifyAdmin: true,
        },
        "max_attempts_reached"
      );
    } else {
      await this.appendAuditEventSafely(
        SECURITY_AUDIT_EVENTS.LOGIN_FAILED,
        {
          ...baseAuditPayload,
          userId: user.id,
          failedAttempts: user.failedLoginAttempts,
          reason,
        },
        reason
      );
    }
  }

  private async appendAuditEventSafely(
    eventName: SecurityAuditEventName,
    payload: Record<string, unknown>,
    reason: string
  ): Promise<void> {
    try {
      await this.outboxRepository.append(createSecurityAuditEvent(eventName, payload));
    } catch (err) {
      if (this.options.failClosedAudit) {
        throw err;
      }
      logger.error({ err, eventName, reason }, "Failed to append auth audit event");
    }
  }
}

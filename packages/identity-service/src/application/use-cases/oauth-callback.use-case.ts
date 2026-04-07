import { randomUUID } from "crypto";
import { User } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-objects/email.vo";
import { USER_CREATED_EVENT } from "@lframework/shared";
import { AccountLockedError, OAuthAuthenticationError, UserInactiveError } from "../errors";
import type { IUserRepository } from "../ports/user-repository.port";
import type { IOAuthAccountRepository } from "../ports/oauth-account-repository.port";
import type { IUserOAuthRegistrationPersistence } from "../ports/user-oauth-registration-persistence.port";
import type { IOAuthProvider } from "../ports/oauth-provider.port";
import type { ITokenService } from "../ports/token-service.port";
import type { IUserCreatedNotifier } from "../ports/user-created-notifier.port";
import type { IOutboxRepository } from "../ports/outbox-repository.port";
import type { OAuthCallbackResponseDto } from "../dtos/oauth-callback-response.dto";
import {
  createSecurityAuditEvent,
  type SecurityAuditEventName,
  type SecurityAuditContext,
  SECURITY_AUDIT_EVENTS,
} from "../security-audit";
import { logger } from "@lframework/shared";
import { toAuthUserDto } from "../dtos/user-profile.mapper";

export type OAuthCallbackResultDto = Omit<OAuthCallbackResponseDto, "expiresIn">;

export class OAuthCallbackUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly oauthAccountRepository: IOAuthAccountRepository,
    private readonly userOAuthRegistrationPersistence: IUserOAuthRegistrationPersistence,
    private readonly tokenService: ITokenService,
    private readonly userCreatedNotifier: IUserCreatedNotifier,
    private readonly outboxRepository: IOutboxRepository
  ) {}

  async execute(
    code: string,
    redirectUri: string,
    provider: IOAuthProvider,
    auditContext: SecurityAuditContext = {}
  ): Promise<OAuthCallbackResultDto> {
    const baseAuditPayload = {
      authMethod: "oauth",
      provider: provider.provider,
      ipAddress: auditContext.ipAddress,
      requestId: auditContext.requestId,
      correlationId: auditContext.correlationId ?? auditContext.requestId,
      userAgent: auditContext.userAgent,
    };

    let userInfo;
    try {
      userInfo = await provider.getUserInfoFromCode(code, redirectUri);
    } catch (err) {
      logger.error(
        { err, provider: provider.provider, requestId: auditContext.requestId },
        "OAuth provider user info retrieval failed"
      );
      await this.appendAuditEventSafely(
        SECURITY_AUDIT_EVENTS.LOGIN_FAILED,
        {
          ...baseAuditPayload,
          reason: "oauth_provider_error",
        },
        "oauth_provider_error"
      );
      throw new OAuthAuthenticationError("OAuth authentication failed");
    }

    if (!userInfo) {
      await this.appendAuditEventSafely(
        SECURITY_AUDIT_EVENTS.LOGIN_FAILED,
        {
          ...baseAuditPayload,
          reason: "oauth_userinfo_unavailable",
        },
        "oauth_userinfo_unavailable"
      );
      throw new OAuthAuthenticationError("OAuth authentication failed");
    }

    const existingLink = await this.oauthAccountRepository.findByProviderAndProviderId(
      provider.provider,
      userInfo.providerId
    );

    if (existingLink) {
      const user = await this.userRepository.findById(existingLink.userId);
      if (!user) {
        await this.appendAuditEventSafely(
          SECURITY_AUDIT_EVENTS.LOGIN_FAILED,
          {
            ...baseAuditPayload,
            email: userInfo.email,
            reason: "oauth_linked_user_missing",
          },
          "oauth_linked_user_missing"
        );
        throw new OAuthAuthenticationError("OAuth authentication failed");
      }
      await this.assertUserCanAuthenticate(user, baseAuditPayload);
      return await this.buildSuccessResult(user, false, baseAuditPayload);
    }

    const email = Email.create(userInfo.email);
    let user = await this.userRepository.findByEmail(email.value);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const id = randomUUID();
      user = User.create(id, email, userInfo.name);
      await this.userOAuthRegistrationPersistence.saveUserAndOAuthAccount(
        user,
        provider.provider,
        userInfo.providerId,
        {
          eventName: USER_CREATED_EVENT,
          correlationId: auditContext.correlationId ?? auditContext.requestId,
          producer: "identity-service",
          payload: {
            userId: user.id,
            email: user.email.value,
            name: user.name,
            occurredAt: user.createdAt.toISOString(),
          },
        }
      );

      await this.userCreatedNotifier.notify({
        id: user.id,
        email: user.email.value,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      });
    } else {
      await this.assertUserCanAuthenticate(user, baseAuditPayload);
      await this.oauthAccountRepository.save(user.id, provider.provider, userInfo.providerId);
    }

    return await this.buildSuccessResult(user, isNewUser, baseAuditPayload);
  }

  private async buildSuccessResult(
    user: User,
    isNewUser: boolean,
    baseAuditPayload: Record<string, unknown>
  ): Promise<OAuthCallbackResultDto> {
    await this.appendAuditEventSafely(
      SECURITY_AUDIT_EVENTS.LOGIN_SUCCEEDED,
      {
        ...baseAuditPayload,
        userId: user.id,
        primaryRole: user.primaryRole,
        roles: user.roles,
        permissions: user.permissions,
        authzVersion: user.authorizationVersion,
        isNewUser,
      },
      "oauth_login_succeeded"
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
      user: toAuthUserDto(user, { isNewUser }),
      accessToken,
    };
  }

  private async assertUserCanAuthenticate(
    user: User,
    baseAuditPayload: Record<string, unknown>
  ): Promise<void> {
    if (!user.isActive) {
      await this.appendAuditEventSafely(
        SECURITY_AUDIT_EVENTS.LOGIN_FAILED,
        {
          ...baseAuditPayload,
          userId: user.id,
          email: user.email.value,
          reason: "inactive_user",
        },
        "inactive_user"
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
          email: user.email.value,
          blockedUntil: user.blockedUntil?.toISOString(),
          reason: "account_locked",
        },
        "account_locked"
      );
      throw new AccountLockedError();
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
      logger.error({ err, eventName, reason }, "Failed to append OAuth audit event");
    }
  }
}

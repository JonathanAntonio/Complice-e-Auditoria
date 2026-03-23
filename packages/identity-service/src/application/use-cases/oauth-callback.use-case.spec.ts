import { describe, it, expect, vi, beforeEach } from "vitest";
import { OAuthCallbackUseCase } from "./oauth-callback.use-case";
import { User } from "../../domain/entities/user.entity";
import type { IUserRepository } from "../ports/user-repository.port";
import type { IOAuthAccountRepository } from "../ports/oauth-account-repository.port";
import type { IUserOAuthRegistrationPersistence } from "../ports/user-oauth-registration-persistence.port";
import type { IOAuthProvider } from "../ports/oauth-provider.port";
import type { ITokenService } from "../ports/token-service.port";
import type { IUserCreatedNotifier } from "../ports/user-created-notifier.port";
import type { IOutboxRepository } from "../ports/outbox-repository.port";
import { AccountLockedError, InvalidCredentialsError, UserInactiveError } from "../errors";
import { USER_ROLES } from "../../domain/types";
import { logger } from "@lframework/shared";

vi.mock("@lframework/shared", async () => {
  const actual = await vi.importActual<typeof import("@lframework/shared")>("@lframework/shared");
  return {
    ...actual,
    logger: {
      ...actual.logger,
      error: vi.fn(),
    },
  };
});

describe("OAuthCallbackUseCase", () => {
  let userRepository: IUserRepository;
  let oauthAccountRepository: IOAuthAccountRepository;
  let userOAuthRegistrationPersistence: IUserOAuthRegistrationPersistence;
  let tokenService: ITokenService;
  let userCreatedNotifier: IUserCreatedNotifier;
  let outboxRepository: IOutboxRepository;
  let provider: IOAuthProvider;

  beforeEach(() => {
    userRepository = {
      save: vi.fn(),
      saveUserAndOutbox: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
    };
    oauthAccountRepository = {
      findByProviderAndProviderId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    };
    userOAuthRegistrationPersistence = {
      saveUserAndOAuthAccount: vi.fn().mockResolvedValue(undefined),
    };
    tokenService = {
      sign: vi.fn().mockReturnValue("jwt-token"),
      verify: vi.fn(),
    };
    userCreatedNotifier = {
      notify: vi.fn().mockResolvedValue(undefined),
    };
    outboxRepository = {
      append: vi.fn().mockResolvedValue(undefined),
    };
    provider = {
      provider: "google",
      getUserInfoFromCode: vi.fn(),
      getAuthorizationUrl: vi.fn(),
    };
  });

  it("deve retornar user e token com isNewUser false quando link OAuth já existe", async () => {
    vi.mocked(provider.getUserInfoFromCode).mockResolvedValue({
      providerId: "google-123",
      email: "existente@example.com",
      name: "Existente",
    });
    vi.mocked(oauthAccountRepository.findByProviderAndProviderId).mockResolvedValue({
      userId: "user-1",
    });
    const user = User.reconstitute(
      "user-1",
      "existente@example.com",
      "Existente",
      new Date("2025-01-01T00:00:00.000Z"),
      USER_ROLES.VISUALIZADOR
    );
    vi.mocked(userRepository.findById).mockResolvedValue(user);

    const useCase = new OAuthCallbackUseCase(
      userRepository,
      oauthAccountRepository,
      userOAuthRegistrationPersistence,
      tokenService,
      userCreatedNotifier,
      outboxRepository
    );
    const result = await useCase.execute("code", "http://localhost/callback", provider);

    expect(result.user.isNewUser).toBe(false);
    expect(result.user.id).toBe("user-1");
    expect(result.user.email).toBe("existente@example.com");
    expect(result.accessToken).toBe("jwt-token");
    expect(tokenService.sign).toHaveBeenCalledWith({
      sub: "user-1",
      email: "existente@example.com",
      role: USER_ROLES.VISUALIZADOR,
    });
    expect(userOAuthRegistrationPersistence.saveUserAndOAuthAccount).not.toHaveBeenCalled();
    expect(userCreatedNotifier.notify).not.toHaveBeenCalled();
  });

  it("deve criar usuário, publicar evento e retornar isNewUser true quando não existe link nem usuário", async () => {
    vi.mocked(provider.getUserInfoFromCode).mockResolvedValue({
      providerId: "google-456",
      email: "novo@example.com",
      name: "Novo User",
    });
    vi.mocked(oauthAccountRepository.findByProviderAndProviderId).mockResolvedValue(null);
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    const useCase = new OAuthCallbackUseCase(
      userRepository,
      oauthAccountRepository,
      userOAuthRegistrationPersistence,
      tokenService,
      userCreatedNotifier,
      outboxRepository
    );
    const result = await useCase.execute("code", "http://localhost/callback", provider);

    expect(result.user.isNewUser).toBe(true);
    expect(result.user.email).toBe("novo@example.com");
    expect(result.user.name).toBe("Novo User");
    expect(result.user.id).toBeDefined();
    expect(result.accessToken).toBe("jwt-token");
    expect(userOAuthRegistrationPersistence.saveUserAndOAuthAccount).toHaveBeenCalledTimes(1);
    expect(userCreatedNotifier.notify).toHaveBeenCalledTimes(1);
  });

  it("deve passar outboxEvent para saveUserAndOAuthAccount quando novo usuário (Outbox Pattern)", async () => {
    vi.mocked(provider.getUserInfoFromCode).mockResolvedValue({
      providerId: "github-789",
      email: "oauth-new@example.com",
      name: "OAuth New",
    });
    vi.mocked(oauthAccountRepository.findByProviderAndProviderId).mockResolvedValue(null);
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    const useCase = new OAuthCallbackUseCase(
      userRepository,
      oauthAccountRepository,
      userOAuthRegistrationPersistence,
      tokenService,
      userCreatedNotifier,
      outboxRepository
    );
    await useCase.execute("code", "http://localhost/callback", provider);

    const saveCall = vi.mocked(userOAuthRegistrationPersistence.saveUserAndOAuthAccount).mock.calls[0];
    expect(saveCall).toHaveLength(4);
    const [, , , outboxEvent] = saveCall;
    expect(outboxEvent).toBeDefined();
    expect(outboxEvent!.eventName).toBe("user.created");
    expect(outboxEvent!.payload).toMatchObject({
      userId: expect.any(String),
      email: "oauth-new@example.com",
      name: "OAuth New",
      occurredAt: expect.any(String),
    });
  });

  it("deve lançar quando getUserInfoFromCode retorna null", async () => {
    vi.mocked(provider.getUserInfoFromCode).mockResolvedValue(null);

    const useCase = new OAuthCallbackUseCase(
      userRepository,
      oauthAccountRepository,
      userOAuthRegistrationPersistence,
      tokenService,
      userCreatedNotifier,
      outboxRepository
    );

    await expect(
      useCase.execute("invalid-code", "http://localhost/callback", provider)
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("deve preservar InvalidCredentialsError quando auditoria falha após erro do provider", async () => {
    vi.mocked(provider.getUserInfoFromCode).mockRejectedValue(new Error("provider failed"));
    vi.mocked(outboxRepository.append).mockRejectedValue(new Error("audit failed"));

    const useCase = new OAuthCallbackUseCase(
      userRepository,
      oauthAccountRepository,
      userOAuthRegistrationPersistence,
      tokenService,
      userCreatedNotifier,
      outboxRepository
    );

    await expect(
      useCase.execute("invalid-code", "http://localhost/callback", provider)
    ).rejects.toThrow("OAuth authentication failed");
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error),
        eventName: "identity.auth.login_failed",
        reason: "oauth_provider_error",
      }),
      "Failed to append OAuth audit event"
    );
  });

  it("deve preservar InvalidCredentialsError quando auditoria falha com userInfo nulo", async () => {
    vi.mocked(provider.getUserInfoFromCode).mockResolvedValue(null);
    vi.mocked(outboxRepository.append).mockRejectedValue(new Error("audit failed"));

    const useCase = new OAuthCallbackUseCase(
      userRepository,
      oauthAccountRepository,
      userOAuthRegistrationPersistence,
      tokenService,
      userCreatedNotifier,
      outboxRepository
    );

    await expect(
      useCase.execute("invalid-code", "http://localhost/callback", provider)
    ).rejects.toThrow("OAuth authentication failed");
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error),
        eventName: "identity.auth.login_failed",
        reason: "oauth_userinfo_unavailable",
      }),
      "Failed to append OAuth audit event"
    );
  });

  it("deve bloquear login OAuth para usuário inativo", async () => {
    vi.mocked(provider.getUserInfoFromCode).mockResolvedValue({
      providerId: "google-123",
      email: "inactive@example.com",
      name: "Inactive",
    });
    vi.mocked(oauthAccountRepository.findByProviderAndProviderId).mockResolvedValue({
      userId: "user-inactive",
    });
    const inactiveUser = User.reconstitute(
      "user-inactive",
      "inactive@example.com",
      "Inactive",
      new Date("2025-01-01T00:00:00.000Z"),
      USER_ROLES.VISUALIZADOR,
      false
    );
    vi.mocked(userRepository.findById).mockResolvedValue(inactiveUser);

    const useCase = new OAuthCallbackUseCase(
      userRepository,
      oauthAccountRepository,
      userOAuthRegistrationPersistence,
      tokenService,
      userCreatedNotifier,
      outboxRepository
    );

    await expect(useCase.execute("code", "http://localhost/callback", provider)).rejects.toThrow(
      UserInactiveError
    );
    expect(outboxRepository.append).toHaveBeenCalled();
  });

  it("deve bloquear login OAuth para usuário temporariamente bloqueado", async () => {
    vi.mocked(provider.getUserInfoFromCode).mockResolvedValue({
      providerId: "google-123",
      email: "locked@example.com",
      name: "Locked",
    });
    vi.mocked(oauthAccountRepository.findByProviderAndProviderId).mockResolvedValue({
      userId: "user-locked",
    });
    const blockedUser = User.reconstitute(
      "user-locked",
      "locked@example.com",
      "Locked",
      new Date("2025-01-01T00:00:00.000Z"),
      USER_ROLES.VISUALIZADOR,
      true,
      5,
      new Date(Date.now() + 15 * 60 * 1000)
    );
    vi.mocked(userRepository.findById).mockResolvedValue(blockedUser);

    const useCase = new OAuthCallbackUseCase(
      userRepository,
      oauthAccountRepository,
      userOAuthRegistrationPersistence,
      tokenService,
      userCreatedNotifier,
      outboxRepository
    );

    await expect(useCase.execute("code", "http://localhost/callback", provider)).rejects.toThrow(
      AccountLockedError
    );
    expect(outboxRepository.append).toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginUseCase } from "./login.use-case";
import { AccountLockedError, InvalidCredentialsError } from "../errors";
import { User } from "../../domain/entities/user.entity";
import type { IUserRepository } from "../ports/user-repository.port";
import type { IAuthCredentialRepository } from "../ports/auth-credential-repository.port";
import type { IOutboxRepository } from "../ports/outbox-repository.port";
import type { IPasswordHasher } from "../ports/password-hasher.port";
import type { ITokenService } from "../ports/token-service.port";
import { USER_ROLES, permissionsForRole } from "../../domain/types";
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

describe("LoginUseCase", () => {
  let userRepository: IUserRepository;
  let authCredentialRepository: IAuthCredentialRepository;
  let outboxRepository: IOutboxRepository;
  let passwordHasher: IPasswordHasher;
  let tokenService: ITokenService;

  beforeEach(() => {
    userRepository = {
      save: vi.fn(),
      saveUserAndOutbox: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
    };
    authCredentialRepository = {
      getPasswordHashByUserId: vi.fn(),
    };
    outboxRepository = {
      append: vi.fn(),
    };
    passwordHasher = {
      hash: vi.fn(),
      verify: vi.fn().mockResolvedValue(true),
    };
    tokenService = {
      sign: vi.fn().mockReturnValue("fake-jwt-token"),
      verify: vi.fn(),
    };
  });

  it("deve retornar user e accessToken quando credenciais são válidas", async () => {
    const user = User.reconstitute(
      "user-1",
      "u@example.com",
      "Nome",
      new Date("2025-01-01T00:00:00.000Z"),
      USER_ROLES.VISUALIZADOR
    );
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);
    vi.mocked(authCredentialRepository.getPasswordHashByUserId).mockResolvedValue("hashed");
    vi.mocked(passwordHasher.verify).mockResolvedValue(true);

    const useCase = new LoginUseCase(
      userRepository,
      authCredentialRepository,
      outboxRepository,
      passwordHasher,
      tokenService
    );
    const result = await useCase.execute({ email: "u@example.com", password: "senha123" });

    expect(result.user).toEqual({
      id: "user-1",
      email: "u@example.com",
      name: "Nome",
      primaryRole: USER_ROLES.VISUALIZADOR,
      permissions: permissionsForRole(USER_ROLES.VISUALIZADOR),
      authzVersion: 1,
      isActive: true,
      createdAt: "2025-01-01T00:00:00.000Z",
    });
    expect(result.accessToken).toBe("fake-jwt-token");
    expect(tokenService.sign).toHaveBeenCalledWith({
      sub: "user-1",
      email: "u@example.com",
      primaryRole: USER_ROLES.VISUALIZADOR,
      permissions: permissionsForRole(USER_ROLES.VISUALIZADOR),
      authzVersion: 1,
    });
    expect(userRepository.saveUserAndOutbox).toHaveBeenCalledTimes(1);
  });

  it("deve lançar InvalidCredentialsError quando usuário não existe", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    const useCase = new LoginUseCase(
      userRepository,
      authCredentialRepository,
      outboxRepository,
      passwordHasher,
      tokenService
    );

    await expect(
      useCase.execute({ email: "naoexiste@example.com", password: "qualquer" })
    ).rejects.toThrow(InvalidCredentialsError);
    await expect(
      useCase.execute({ email: "naoexiste@example.com", password: "qualquer" })
    ).rejects.toThrow("Invalid email or password");
    expect(authCredentialRepository.getPasswordHashByUserId).not.toHaveBeenCalled();
    expect(outboxRepository.append).toHaveBeenCalledTimes(2);
  });

  it("deve preservar InvalidCredentialsError quando auditoria de login falha para usuário inexistente", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(outboxRepository.append).mockRejectedValue(new Error("audit failed"));

    const useCase = new LoginUseCase(
      userRepository,
      authCredentialRepository,
      outboxRepository,
      passwordHasher,
      tokenService
    );

    await expect(
      useCase.execute({ email: "naoexiste@example.com", password: "qualquer" })
    ).rejects.toThrow("Invalid email or password");
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error),
        requestId: undefined,
      }),
      "Failed to append login failed audit event"
    );
  });

  it("deve lançar InvalidCredentialsError quando hash não existe para o usuário", async () => {
    const user = User.reconstitute("user-1", "u@example.com", "Nome", new Date(), USER_ROLES.VISUALIZADOR);
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);
    vi.mocked(authCredentialRepository.getPasswordHashByUserId).mockResolvedValue(null);

    const useCase = new LoginUseCase(
      userRepository,
      authCredentialRepository,
      outboxRepository,
      passwordHasher,
      tokenService
    );

    await expect(
      useCase.execute({ email: "u@example.com", password: "senha" })
    ).rejects.toThrow(InvalidCredentialsError);
    expect(passwordHasher.verify).not.toHaveBeenCalled();
  });

  it("deve lançar InvalidCredentialsError quando senha está incorreta", async () => {
    const user = User.reconstitute("user-1", "u@example.com", "Nome", new Date(), USER_ROLES.VISUALIZADOR);
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);
    vi.mocked(authCredentialRepository.getPasswordHashByUserId).mockResolvedValue("hashed");
    vi.mocked(passwordHasher.verify).mockResolvedValue(false);

    const useCase = new LoginUseCase(
      userRepository,
      authCredentialRepository,
      outboxRepository,
      passwordHasher,
      tokenService
    );

    await expect(
      useCase.execute({ email: "u@example.com", password: "senhaerrada" })
    ).rejects.toThrow(InvalidCredentialsError);
    expect(tokenService.sign).not.toHaveBeenCalled();
    expect(userRepository.saveUserAndOutbox).toHaveBeenCalledTimes(1);
  });

  it("deve bloquear a conta após 5 tentativas inválidas", async () => {
    const user = User.reconstitute(
      "user-1",
      "u@example.com",
      "Nome",
      new Date(),
      USER_ROLES.VISUALIZADOR,
      true,
      4,
      null
    );
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);
    vi.mocked(authCredentialRepository.getPasswordHashByUserId).mockResolvedValue("hashed");
    vi.mocked(passwordHasher.verify).mockResolvedValue(false);

    const useCase = new LoginUseCase(
      userRepository,
      authCredentialRepository,
      outboxRepository,
      passwordHasher,
      tokenService
    );

    await expect(
      useCase.execute({ email: "u@example.com", password: "senhaerrada" })
    ).rejects.toThrow(AccountLockedError);
    expect(userRepository.saveUserAndOutbox).toHaveBeenCalledTimes(1);
  });
});

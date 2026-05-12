import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginUseCase } from "./login.use-case";
import type { IUserRepository } from "../ports/user-repository.port";
import type { IPasswordHasher } from "../ports/password-hasher.port";
import type { ITokenService } from "../ports/token-service.port";
import type { IOutboxRepository } from "../ports/outbox-repository.port";
import { User } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-objects/email.vo";
import {
  InvalidCredentialsError,
  UserInactiveError,
  AccountLockedError,
} from "../errors";
import { USER_ROLES } from "../../domain/types";

describe("LoginUseCase", () => {
  let userRepository: IUserRepository;
  let passwordHasher: IPasswordHasher;
  let tokenService: ITokenService;
  let outboxRepository: IOutboxRepository;
  let useCase: LoginUseCase;

  beforeEach(() => {
    userRepository = {
      findByEmail: vi.fn(),
      save: vi.fn(),
    } as unknown as IUserRepository;
    passwordHasher = {
      compare: vi.fn(),
    } as unknown as IPasswordHasher;
    tokenService = {
      sign: vi.fn().mockReturnValue("token-123"),
    } as unknown as ITokenService;
    outboxRepository = {
      append: vi.fn(),
    } as unknown as IOutboxRepository;

    useCase = new LoginUseCase(
      userRepository,
      passwordHasher,
      tokenService,
      outboxRepository
    );
  });

  it("deve autenticar com sucesso quando credenciais válidas", async () => {
    const user = User.create(
      "user-1",
      Email.create("u@example.com"),
      "User",
      USER_ROLES.VISUALIZADOR,
      [USER_ROLES.VISUALIZADOR],
      "hashed-pwd"
    );
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);
    vi.mocked(passwordHasher.compare).mockResolvedValue(true);

    const result = await useCase.execute({
      email: "u@example.com",
      password: "password123",
    });

    expect(result.accessToken).toBe("token-123");
    expect(result.user.email).toBe("u@example.com");
    expect(user.failedLoginAttempts).toBe(0);
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(outboxRepository.append).toHaveBeenCalled();
  });

  it("deve lançar InvalidCredentialsError quando usuário não existe", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(
      useCase.execute({ email: "notfound@example.com", password: "any" })
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("deve lançar UserInactiveError quando usuário inativo", async () => {
    const user = User.create(
      "user-1",
      Email.create("u@example.com"),
      "User",
      USER_ROLES.VISUALIZADOR
    );
    user.markInactive();
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);

    await expect(
      useCase.execute({ email: "u@example.com", password: "any" })
    ).rejects.toThrow(UserInactiveError);
  });

  it("deve lançar AccountLockedError quando conta bloqueada", async () => {
    const user = User.reconstitute(
      "user-1",
      "u@example.com",
      "User",
      new Date(),
      USER_ROLES.VISUALIZADOR,
      true,
      5,
      new Date(Date.now() + 1000 * 60)
    );
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);

    await expect(
      useCase.execute({ email: "u@example.com", password: "any" })
    ).rejects.toThrow(AccountLockedError);
  });

  it("deve registrar falha e lançar InvalidCredentialsError quando senha incorreta", async () => {
    const user = User.create(
      "user-1",
      Email.create("u@example.com"),
      "User",
      USER_ROLES.VISUALIZADOR,
      [USER_ROLES.VISUALIZADOR],
      "hashed-pwd"
    );
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);
    vi.mocked(passwordHasher.compare).mockResolvedValue(false);

    await expect(
      useCase.execute({ email: "u@example.com", password: "wrong" })
    ).rejects.toThrow(InvalidCredentialsError);

    expect(user.failedLoginAttempts).toBe(1);
    expect(userRepository.save).toHaveBeenCalledWith(user);
  });

  it("deve bloquear conta após 5 tentativas falhas", async () => {
    const user = User.reconstitute(
      "user-1",
      "u@example.com",
      "User",
      new Date(),
      USER_ROLES.VISUALIZADOR,
      true,
      4,
      null,
      "hashed-pwd"
    );
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);
    vi.mocked(passwordHasher.compare).mockResolvedValue(false);

    await expect(
      useCase.execute({ email: "u@example.com", password: "wrong" })
    ).rejects.toThrow(InvalidCredentialsError);

    expect(user.failedLoginAttempts).toBe(5);
    expect(user.blockedUntil).not.toBeNull();
    expect(userRepository.save).toHaveBeenCalledWith(user);
  });
});

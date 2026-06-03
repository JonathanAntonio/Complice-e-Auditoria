import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateUserUseCase } from "./create-user.use-case";
import { UserAlreadyExistsError, InvalidEmailError } from "../errors";
import { User } from "../../domain/entities/user.entity";
import type { IUserRepository } from "../ports/user-repository.port";
import type { IUserCreatedNotifier } from "../ports/user-created-notifier.port";
import { USER_ROLES, USER_ROLE_VALUES, permissionsForRole, permissionsForRoles } from "../../domain/types";

describe("CreateUserUseCase", () => {
  let userRepository: IUserRepository;
  let userCreatedNotifier: IUserCreatedNotifier;

  beforeEach(() => {
    userRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      saveUserAndOutbox: vi.fn().mockResolvedValue(undefined),
      saveUserAndOutboxBatch: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(null),
      countUsers: vi.fn().mockResolvedValue(1),
    };
    userCreatedNotifier = {
      notify: vi.fn().mockResolvedValue(undefined),
    };
  });

  it("deve criar usuário com sucesso e retornar UserResponseDto", async () => {
    const useCase = new CreateUserUseCase(userRepository, userCreatedNotifier);
    const dto = { email: "user@example.com", name: "João Silva" };

    const result = await useCase.execute(dto);

    expect(result).toMatchObject({
      email: "user@example.com",
      name: "João Silva",
      primaryRole: USER_ROLES.VISUALIZADOR,
      roles: [USER_ROLES.VISUALIZADOR],
      permissions: permissionsForRole(USER_ROLES.VISUALIZADOR),
      authzVersion: 1,
      isActive: true,
    });
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(userRepository.findByEmail).toHaveBeenCalledWith("user@example.com");
    expect(userRepository.saveUserAndOutboxBatch).toHaveBeenCalled();
    expect(userCreatedNotifier.notify).toHaveBeenCalled();
  });

  it("deve conceder todas as permissões para o primeiro usuário cadastrado", async () => {
    vi.mocked(userRepository.countUsers!).mockResolvedValue(0);
    const useCase = new CreateUserUseCase(userRepository, userCreatedNotifier);
    const dto = { email: "first@example.com", name: "First User" };

    const result = await useCase.execute(dto);

    expect(result).toMatchObject({
      email: "first@example.com",
      name: "First User",
      primaryRole: USER_ROLES.ADMINISTRADOR,
      roles: USER_ROLE_VALUES,
      permissions: permissionsForRoles(USER_ROLE_VALUES),
      authzVersion: 1,
      isActive: true,
    });
  });

  it("deve lançar UserAlreadyExistsError quando o email já existe", async () => {
    const existingUser = User.reconstitute(
      "existing-id",
      "existing@example.com",
      "Existing",
      new Date(),
      USER_ROLES.VISUALIZADOR
    );
    vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser);

    const useCase = new CreateUserUseCase(userRepository, userCreatedNotifier);
    const dto = { email: "existing@example.com", name: "Outro" };

    await expect(useCase.execute(dto)).rejects.toThrow(UserAlreadyExistsError);
    await expect(useCase.execute(dto)).rejects.toThrow("User with this email already exists");
    expect(userRepository.saveUserAndOutbox).not.toHaveBeenCalled();
    expect(userRepository.saveUserAndOutboxBatch).not.toHaveBeenCalled();
  });

  it("deve lançar InvalidEmailError para email inválido", async () => {
    const useCase = new CreateUserUseCase(userRepository, userCreatedNotifier);
    const dto = { email: "invalid-email", name: "João" };

    await expect(useCase.execute(dto)).rejects.toThrow(InvalidEmailError);
    await expect(useCase.execute(dto)).rejects.toThrow("Invalid email");
    expect(userRepository.saveUserAndOutbox).not.toHaveBeenCalled();
    expect(userRepository.saveUserAndOutboxBatch).not.toHaveBeenCalled();
  });

  it("deve chamar saveUserAndOutboxBatch com eventos de domínio e auditoria", async () => {
    const useCase = new CreateUserUseCase(userRepository, userCreatedNotifier);
    const dto = { email: "evt@example.com", name: "Event User" };

    await useCase.execute(dto);

    expect(userRepository.saveUserAndOutboxBatch).toHaveBeenCalledTimes(1);
    const [user, outboxEvents] = vi.mocked(userRepository.saveUserAndOutboxBatch!).mock.calls[0];
    expect(user.email.value).toBe("evt@example.com");
    expect(user.name).toBe("Event User");
    expect(outboxEvents).toHaveLength(2);
    expect(outboxEvents[0].eventName).toBe("user.created");
    expect(outboxEvents[0].payload).toMatchObject({
      userId: user.id,
      email: "evt@example.com",
      name: "Event User",
      occurredAt: expect.any(String),
    });
    expect(outboxEvents[1].eventName).toBe("identity.auth.user_created");
    expect(outboxEvents[1].payload).toMatchObject({
      actorUserId: user.id,
      targetUserId: user.id,
      email: "evt@example.com",
      occurredAt: expect.any(String),
    });
  });
});

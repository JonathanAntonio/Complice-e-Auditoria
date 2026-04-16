import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetCurrentUserUseCase } from "./get-current-user.use-case";
import { User } from "../../domain/entities/user.entity";
import type { IUserRepository } from "../ports/user-repository.port";
import { USER_ROLES, permissionsForRole } from "../../domain/types";
import { InvalidSessionError } from "../errors";

describe("GetCurrentUserUseCase", () => {
  let userRepository: IUserRepository;

  beforeEach(() => {
    userRepository = {
      save: vi.fn(),
      saveUserAndOutbox: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
    };
  });

  it("deve retornar UserResponseDto quando usuário existe", async () => {
    const user = User.reconstitute(
      "user-123",
      "u@example.com",
      "Nome Completo",
      new Date("2025-01-15T12:00:00.000Z"),
      USER_ROLES.VISUALIZADOR
    );
    vi.mocked(userRepository.findById).mockResolvedValue(user);

    const useCase = new GetCurrentUserUseCase(userRepository);
    const result = await useCase.execute("user-123");

    expect(result).toEqual({
      id: "user-123",
      email: "u@example.com",
      name: "Nome Completo",
      primaryRole: USER_ROLES.VISUALIZADOR,
      roles: [USER_ROLES.VISUALIZADOR],
      permissions: permissionsForRole(USER_ROLES.VISUALIZADOR),
      authzVersion: 1,
      isActive: true,
      createdAt: "2025-01-15T12:00:00.000Z",
    });
    expect(userRepository.findById).toHaveBeenCalledWith("user-123");
  });

  it("deve retornar null quando usuário não existe", async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(null);

    const useCase = new GetCurrentUserUseCase(userRepository);
    const result = await useCase.execute("inexistente", 1);

    expect(result).toBeNull();
    expect(userRepository.findById).toHaveBeenCalledWith("inexistente");
  });

  it("deve falhar quando authzVersion do token diverge da versão atual do usuário", async () => {
    const user = User.reconstitute(
      "user-123",
      "u@example.com",
      "Nome Completo",
      new Date("2025-01-15T12:00:00.000Z"),
      USER_ROLES.VISUALIZADOR
    );
    user.invalidateSessions();
    vi.mocked(userRepository.findById).mockResolvedValue(user);

    const useCase = new GetCurrentUserUseCase(userRepository);

    await expect(useCase.execute("user-123", 1)).rejects.toBeInstanceOf(InvalidSessionError);
  });
});

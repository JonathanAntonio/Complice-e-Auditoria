import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserController } from "./user.controller";
import type { CreateUserUseCase } from "../../../application/use-cases/create-user.use-case";
import type { GetUserByIdUseCase } from "../../../application/use-cases/get-user-by-id.use-case";
import type { AssignUserRoleUseCase } from "../../../application/use-cases/assign-user-role.use-case";
import type { Response } from "express";
import type { NextFunction } from "express";
import {
  UserAlreadyExistsError,
  InvalidEmailError,
} from "../../../application/errors";
import { mapApplicationErrorToHttp } from "./error-to-http.mapper";
import { sendError } from "@lframework/shared";
import { createMockAuthenticatedRequest } from "@lframework/shared/test";
import { USER_ROLES, permissionsForRole } from "../../../domain/types";

describe("UserController", () => {
  let createUserUseCase: CreateUserUseCase;
  let getUserByIdUseCase: GetUserByIdUseCase;
  let assignUserRoleUseCase: AssignUserRoleUseCase;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    createUserUseCase = { execute: vi.fn() } as unknown as CreateUserUseCase;
    getUserByIdUseCase = { execute: vi.fn() } as unknown as GetUserByIdUseCase;
    assignUserRoleUseCase = { execute: vi.fn() } as unknown as AssignUserRoleUseCase;
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = ((err: unknown) => {
      const { statusCode, message } = mapApplicationErrorToHttp(err);
      sendError(res as Response, statusCode, message);
    }) as NextFunction;
  });

  describe("create", () => {
    it("deve retornar 201 e o usuário criado em sucesso", async () => {
      const created = {
        id: "id-1",
        email: "u@example.com",
        name: "Nome",
        primaryRole: USER_ROLES.VISUALIZADOR,
        permissions: permissionsForRole(USER_ROLES.VISUALIZADOR),
        authzVersion: 1,
        isActive: true,
        createdAt: "2025-01-01T00:00:00.000Z",
      };
      vi.mocked(createUserUseCase.execute).mockResolvedValue(created);

      const controller = new UserController(
        createUserUseCase,
        getUserByIdUseCase,
        assignUserRoleUseCase
      );
      const req = createMockAuthenticatedRequest({
        body: { email: "u@example.com", name: "Nome" },
        userId: "admin-1",
      });
      await controller.create(req, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(created);
    });

    it("deve retornar 409 quando UserAlreadyExistsError", async () => {
      vi.mocked(createUserUseCase.execute).mockRejectedValue(
        new UserAlreadyExistsError("User with this email already exists")
      );

      const controller = new UserController(
        createUserUseCase,
        getUserByIdUseCase,
        assignUserRoleUseCase
      );
      const req = createMockAuthenticatedRequest({
        body: { email: "existente@example.com", name: "X" },
        userId: "a",
      });
      await controller.create(req, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: "User with this email already exists" });
    });

    it("deve retornar 400 quando InvalidEmailError", async () => {
      vi.mocked(createUserUseCase.execute).mockRejectedValue(new InvalidEmailError("Invalid email"));

      const controller = new UserController(
        createUserUseCase,
        getUserByIdUseCase,
        assignUserRoleUseCase
      );
      const req = createMockAuthenticatedRequest({
        body: { email: "invalido", name: "X" },
        userId: "a",
      });
      await controller.create(req, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid email" });
    });
  });

  describe("getById", () => {
    const uuidOwner = "11111111-1111-1111-1111-111111111111";

    it("deve retornar usuário quando encontrado", async () => {
      const user = {
        id: uuidOwner,
        email: "u@example.com",
        name: "Nome",
        primaryRole: USER_ROLES.VISUALIZADOR,
        permissions: permissionsForRole(USER_ROLES.VISUALIZADOR),
        authzVersion: 1,
        isActive: true,
        createdAt: "2025-01-01T00:00:00.000Z",
      };
      vi.mocked(getUserByIdUseCase.execute).mockResolvedValue(user);

      const controller = new UserController(
        createUserUseCase,
        getUserByIdUseCase,
        assignUserRoleUseCase
      );
      const req = createMockAuthenticatedRequest({
        params: { id: uuidOwner },
        userId: uuidOwner,
      });
      await controller.getById(req, res as Response, next);

      expect(res.json).toHaveBeenCalledWith(user);
      expect(getUserByIdUseCase.execute).toHaveBeenCalledWith(uuidOwner);
    });

    it("deve retornar 400 quando id não é UUID", async () => {
      const controller = new UserController(
        createUserUseCase,
        getUserByIdUseCase,
        assignUserRoleUseCase
      );
      const req = createMockAuthenticatedRequest({
        params: { id: "nao-uuid" },
        userId: uuidOwner,
      });
      await controller.getById(req, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid user id format" });
      expect(getUserByIdUseCase.execute).not.toHaveBeenCalled();
    });

    it("deve retornar 404 quando usuário não existe", async () => {
      vi.mocked(getUserByIdUseCase.execute).mockResolvedValue(null);

      const controller = new UserController(
        createUserUseCase,
        getUserByIdUseCase,
        assignUserRoleUseCase
      );
      const req = createMockAuthenticatedRequest({
        params: { id: uuidOwner },
        userId: uuidOwner,
      });
      await controller.getById(req, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });
  });

  describe("assignRole", () => {
    const userId = "11111111-1111-1111-1111-111111111111";

    it("deve retornar 200 com usuário atualizado", async () => {
      const updated = {
        id: userId,
        email: "u@example.com",
        name: "Nome",
        primaryRole: USER_ROLES.ADMINISTRADOR,
        permissions: permissionsForRole(USER_ROLES.ADMINISTRADOR),
        authzVersion: 2,
        isActive: true,
        createdAt: "2025-01-01T00:00:00.000Z",
      };
      vi.mocked(assignUserRoleUseCase.execute).mockResolvedValue(updated);
      const controller = new UserController(
        createUserUseCase,
        getUserByIdUseCase,
        assignUserRoleUseCase
      );

      const req = createMockAuthenticatedRequest({
        params: { id: userId },
        body: { primaryRole: USER_ROLES.ADMINISTRADOR },
        userId: "actor-1",
      });
      await controller.assignRole(req, res as Response, next);

      expect(assignUserRoleUseCase.execute).toHaveBeenCalledWith(
        userId,
        { primaryRole: USER_ROLES.ADMINISTRADOR },
        "actor-1"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it("deve retornar 404 quando usuário não existe", async () => {
      vi.mocked(assignUserRoleUseCase.execute).mockResolvedValue(null);
      const controller = new UserController(
        createUserUseCase,
        getUserByIdUseCase,
        assignUserRoleUseCase
      );

      const req = createMockAuthenticatedRequest({
        params: { id: userId },
        body: { primaryRole: USER_ROLES.ADMINISTRADOR },
        userId: "actor-1",
      });
      await controller.assignRole(req, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("deve retornar 403 quando requester não está autenticado", async () => {
      const controller = new UserController(
        createUserUseCase,
        getUserByIdUseCase,
        assignUserRoleUseCase
      );

      const req = createMockAuthenticatedRequest({
        params: { id: userId },
        body: { primaryRole: USER_ROLES.ADMINISTRADOR },
        userId: undefined,
      });
      await controller.assignRole(req, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
      expect(assignUserRoleUseCase.execute).not.toHaveBeenCalled();
    });
  });
});

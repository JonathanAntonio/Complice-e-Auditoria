import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import { NextFunction } from "express";
import { AuthController } from "./auth.controller";
import type { GetCurrentUserUseCase } from "../../../application/use-cases/get-current-user.use-case";
import type { OAuthCallbackUseCase } from "../../../application/use-cases/oauth-callback.use-case";
import type { LoginUseCase } from "../../../application/use-cases/login.use-case";
import type { CreateUserUseCase } from "../../../application/use-cases/create-user.use-case";
import type { LogoutUseCase } from "../../../application/use-cases/logout.use-case";
import type { IOAuthProvider } from "../../../application/ports/oauth-provider.port";
import type { ITokenService } from "../../../application/ports/token-service.port";
import type { ICacheService } from "@lframework/shared";
import { mapApplicationErrorToHttp } from "./error-to-http.mapper";
import { sendError } from "@lframework/shared";
import { createMockRequest, createMockResponse, createMockAuthenticatedRequest } from "@lframework/shared/test";

describe("AuthController", () => {
  let getCurrentUserUseCase: GetCurrentUserUseCase;
  let oauthCallbackUseCase: OAuthCallbackUseCase;
  let loginUseCase: LoginUseCase;
  let createUserUseCase: CreateUserUseCase;
  let logoutUseCase: LogoutUseCase;
  let tokenService: ITokenService;
  let googleProvider: IOAuthProvider | null;
  let githubProvider: IOAuthProvider | null;
  let cache: ICacheService;
  let res: Response;
  let next: NextFunction;

  const baseUrl = "https://api.example.com";
  const jwtExpiresInSeconds = 3600;

  const mockUser = {
    id: "user-1",
    email: "u@example.com",
    name: "User",
    primaryRole: "visualizador",
    roles: ["visualizador"],
    permissions: [],
    authzVersion: 1,
    createdAt: "2025-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    getCurrentUserUseCase = { execute: vi.fn() } as unknown as GetCurrentUserUseCase;
    oauthCallbackUseCase = { execute: vi.fn() } as unknown as OAuthCallbackUseCase;
    loginUseCase = { execute: vi.fn() } as unknown as LoginUseCase;
    createUserUseCase = { execute: vi.fn() } as unknown as CreateUserUseCase;
    logoutUseCase = { execute: vi.fn() } as unknown as LogoutUseCase;
    tokenService = { sign: vi.fn().mockReturnValue("token-123"), verify: vi.fn() } as unknown as ITokenService;
    googleProvider = null;
    githubProvider = null;
    cache = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    } as unknown as ICacheService;
    res = createMockResponse();
    next = ((err: unknown) => {
      const { statusCode, message } = mapApplicationErrorToHttp(err);
      sendError(res, statusCode, message);
    }) as NextFunction;
  });

  function createController(withLogout = false): AuthController {
    return new AuthController(
      getCurrentUserUseCase,
      oauthCallbackUseCase,
      googleProvider,
      githubProvider,
      baseUrl,
      cache,
      jwtExpiresInSeconds,
      loginUseCase,
      createUserUseCase,
      tokenService,
      withLogout ? logoutUseCase : undefined
    );
  }

  describe("me", () => {
    it("deve retornar 200 com user quando usuário existe", async () => {
      vi.mocked(getCurrentUserUseCase.execute).mockResolvedValue(mockUser as any);
      const controller = createController();
      const req = createMockAuthenticatedRequest({ userId: "user-1" });

      await controller.me(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockUser);
      expect(getCurrentUserUseCase.execute).toHaveBeenCalledWith("user-1", undefined);
    });

    it("deve retornar 404 quando usuário não encontrado", async () => {
      vi.mocked(getCurrentUserUseCase.execute).mockResolvedValue(null);
      const controller = createController();
      const req = createMockAuthenticatedRequest({ userId: "user-1" });

      await controller.me(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });
  });

  describe("googleAuthorizationUrl", () => {
    it("deve retornar 503 quando Google OAuth não está configurado", async () => {
      const controller = createController();
      const req = createMockRequest();

      await controller.googleAuthorizationUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ error: "Google OAuth is not configured" });
    });

    it("deve retornar url quando provider está configurado", async () => {
      const redirectUrl = "https://accounts.google.com/authorize?...";
      const mockProvider: IOAuthProvider = {
        getAuthorizationUrl: vi.fn().mockReturnValue(redirectUrl),
        getAccessToken: vi.fn(),
        getProfile: vi.fn(),
        provider: "google"
      } as any;
      const controller = new AuthController(
        getCurrentUserUseCase,
        oauthCallbackUseCase,
        mockProvider,
        githubProvider,
        baseUrl,
        cache,
        jwtExpiresInSeconds,
        loginUseCase,
        createUserUseCase,
        tokenService
      );
      vi.mocked(cache.set).mockResolvedValue(undefined);
      const req = createMockRequest();

      await controller.googleAuthorizationUrl(req, res);

      expect(mockProvider.getAuthorizationUrl).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ url: redirectUrl });
    });
  });

  describe("OAuth callback (googleCallback / handleOAuthCallback)", () => {
    const validCode = "auth-code-123";
    const validState = "state-xyz";

    it("deve retornar 400 with message 'Invalid or expired state' quando state não está no cache", async () => {
      vi.mocked(cache.get).mockResolvedValue(null);
      const mockProvider: IOAuthProvider = {
        getAuthorizationUrl: vi.fn(),
        getAccessToken: vi.fn(),
        getProfile: vi.fn(),
        provider: "google"
      } as any;
      const controller = new AuthController(
        getCurrentUserUseCase,
        oauthCallbackUseCase,
        mockProvider,
        githubProvider,
        baseUrl,
        cache,
        jwtExpiresInSeconds,
        loginUseCase,
        createUserUseCase,
        tokenService
      );
      const req = createMockRequest({ query: { code: validCode, state: validState } });

      await controller.googleCallback(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired state" });
      expect(oauthCallbackUseCase.execute).not.toHaveBeenCalled();
    });

    it("deve retornar 200 com user e token quando state válido e callback sucesso", async () => {
      vi.mocked(cache.get).mockResolvedValue("1");
      vi.mocked(cache.delete).mockResolvedValue(undefined);
      vi.mocked(oauthCallbackUseCase.execute).mockResolvedValue({
        user: { ...mockUser, isNewUser: false, createdAt: mockUser.createdAt! } as any,
        accessToken: "oauth-token",
      });
      const mockProvider: IOAuthProvider = {
        getAuthorizationUrl: vi.fn(),
        getAccessToken: vi.fn(),
        getProfile: vi.fn(),
        provider: "google"
      } as any;
      const controller = new AuthController(
        getCurrentUserUseCase,
        oauthCallbackUseCase,
        mockProvider,
        githubProvider,
        baseUrl,
        cache,
        jwtExpiresInSeconds,
        loginUseCase,
        createUserUseCase,
        tokenService
      );
      const req = createMockRequest({ query: { code: validCode, state: validState } });

      await controller.googleCallback(req, res, next);

      expect(cache.get).toHaveBeenCalledWith("oauth_state:state-xyz");
      expect(cache.delete).toHaveBeenCalledWith("oauth_state:state-xyz");
      expect(oauthCallbackUseCase.execute).toHaveBeenCalledWith(
        validCode,
        "https://api.example.com/api/auth/google/callback",
        mockProvider,
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith({
        user: expect.objectContaining({ id: mockUser.id, email: mockUser.email, name: mockUser.name }),
        accessToken: "oauth-token",
        expiresIn: "1h",
      });
    });
  });

  describe("login", () => {
    it("deve retornar 200 com user e token em sucesso", async () => {
      const result = {
        user: { ...mockUser, isNewUser: false, createdAt: mockUser.createdAt! },
        accessToken: "token-123",
      };
      vi.mocked(loginUseCase.execute).mockResolvedValue(result as any);

      const controller = createController();
      const req = createMockRequest({
        body: { email: "u@example.com", password: "password123" },
      });

      await controller.login(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        ...result,
        expiresIn: "1h",
      });
    });
  });

  describe("register", () => {
    it("deve retornar 201 com user e token em sucesso", async () => {
      vi.mocked(createUserUseCase.execute).mockResolvedValue(mockUser as any);
      const controller = createController();
      const req = createMockRequest({
        body: { email: "new@example.com", name: "New User", password: "password123" },
      });

      await controller.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        user: mockUser,
        accessToken: "token-123",
      }));
      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        email: "new@example.com",
        name: "New User",
        password: "password123",
      });
    });
  });

  describe("logout", () => {
    it("deve retornar 503 quando logout não está disponível", async () => {
      const controller = createController();
      const req = createMockAuthenticatedRequest({ userId: "user-1" });

      await controller.logout(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ error: "Logout is not available" });
    });

    it("deve retornar 204 quando logout use case está disponível", async () => {
      vi.mocked(logoutUseCase.execute).mockResolvedValue(undefined);
      const controller = createController(true);
      const req = createMockAuthenticatedRequest({
        userId: "user-1",
        headers: { "x-request-id": "req-1", "user-agent": "vitest" },
        ip: "127.0.0.1",
      });

      await controller.logout(req, res, next);

      expect(logoutUseCase.execute).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});

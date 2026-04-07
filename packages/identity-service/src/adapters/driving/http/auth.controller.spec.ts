import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import { NextFunction } from "express";
import { AuthController } from "./auth.controller";
import type { GetCurrentUserUseCase } from "../../../application/use-cases/get-current-user.use-case";
import type { OAuthCallbackUseCase } from "../../../application/use-cases/oauth-callback.use-case";
import type { LogoutUseCase } from "../../../application/use-cases/logout.use-case";
import type { IOAuthProvider } from "../../../application/ports/oauth-provider.port";
import type { ICacheService } from "@lframework/shared";
import { mapApplicationErrorToHttp } from "./error-to-http.mapper";
import { sendError } from "@lframework/shared";
import { createMockRequest, createMockResponse, createMockAuthenticatedRequest } from "@lframework/shared/test";

describe("AuthController", () => {
  let getCurrentUserUseCase: GetCurrentUserUseCase;
  let oauthCallbackUseCase: OAuthCallbackUseCase;
  let logoutUseCase: LogoutUseCase;
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
    createdAt: "2025-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    getCurrentUserUseCase = { execute: vi.fn() } as unknown as GetCurrentUserUseCase;
    oauthCallbackUseCase = { execute: vi.fn() } as unknown as OAuthCallbackUseCase;
    logoutUseCase = { execute: vi.fn() } as unknown as LogoutUseCase;
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
      withLogout ? logoutUseCase : undefined
    );
  }

  describe("me", () => {
    it("deve retornar 200 com user quando usuário existe", async () => {
      vi.mocked(getCurrentUserUseCase.execute).mockResolvedValue(mockUser);
      const controller = createController();
      const req = createMockAuthenticatedRequest({ userId: "user-1" });

      await controller.me(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockUser);
      expect(getCurrentUserUseCase.execute).toHaveBeenCalledWith("user-1");
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
      };
      const controller = new AuthController(
        getCurrentUserUseCase,
        oauthCallbackUseCase,
        mockProvider,
        githubProvider,
        baseUrl,
        cache,
        jwtExpiresInSeconds
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

    it("deve retornar 400 com mensagem 'Invalid or expired state' quando state não está no cache", async () => {
      vi.mocked(cache.get).mockResolvedValue(null);
      const mockProvider: IOAuthProvider = {
        getAuthorizationUrl: vi.fn(),
        getAccessToken: vi.fn(),
        getProfile: vi.fn(),
      };
      const controller = new AuthController(
        getCurrentUserUseCase,
        oauthCallbackUseCase,
        mockProvider,
        githubProvider,
        baseUrl,
        cache,
        jwtExpiresInSeconds
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
        user: { ...mockUser, isNewUser: false, createdAt: mockUser.createdAt! },
        accessToken: "oauth-token",
      });
      const mockProvider: IOAuthProvider = {
        getAuthorizationUrl: vi.fn(),
        getAccessToken: vi.fn(),
        getProfile: vi.fn(),
      };
      const controller = new AuthController(
        getCurrentUserUseCase,
        oauthCallbackUseCase,
        mockProvider,
        githubProvider,
        baseUrl,
        cache,
        jwtExpiresInSeconds
      );
      const req = createMockRequest({ query: { code: validCode, state: validState } });

      await controller.googleCallback(req, res, next);

      expect(cache.get).toHaveBeenCalledWith("oauth_state:state-xyz");
      expect(cache.delete).toHaveBeenCalledWith("oauth_state:state-xyz");
      expect(oauthCallbackUseCase.execute).toHaveBeenCalledWith(
        validCode,
        "https://api.example.com/api/auth/google/callback",
        mockProvider,
        {
          ipAddress: undefined,
          requestId: undefined,
          correlationId: undefined,
          userAgent: undefined,
        }
      );
      expect(res.json).toHaveBeenCalledWith({
        user: expect.objectContaining({ id: mockUser.id, email: mockUser.email, name: mockUser.name }),
        accessToken: "oauth-token",
        expiresIn: "1h",
      });
    });

    it("deve usar redirectUri persistido no state payload (formato novo)", async () => {
      const persistedRedirectUri = "https://apparent-driving-horse.ngrok-free.app/bff/auth/google/callback";
      vi.mocked(cache.get).mockResolvedValue({ redirectUri: persistedRedirectUri });
      vi.mocked(cache.delete).mockResolvedValue(undefined);
      vi.mocked(oauthCallbackUseCase.execute).mockResolvedValue({
        user: { ...mockUser, isNewUser: false, createdAt: mockUser.createdAt! },
        accessToken: "oauth-token",
      });

      const mockProvider: IOAuthProvider = {
        getAuthorizationUrl: vi.fn(),
        getAccessToken: vi.fn(),
        getProfile: vi.fn(),
      };
      const controller = new AuthController(
        getCurrentUserUseCase,
        oauthCallbackUseCase,
        mockProvider,
        githubProvider,
        baseUrl,
        cache,
        jwtExpiresInSeconds
      );
      const req = createMockRequest({ query: { code: validCode, state: validState } });

      await controller.googleCallback(req, res, next);

      expect(oauthCallbackUseCase.execute).toHaveBeenCalledWith(
        validCode,
        persistedRedirectUri,
        mockProvider,
        {
          ipAddress: undefined,
          requestId: undefined,
          correlationId: undefined,
          userAgent: undefined,
        }
      );
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

      expect(logoutUseCase.execute).toHaveBeenCalledWith("user-1", {
        ipAddress: "127.0.0.1",
        requestId: "req-1",
        correlationId: "req-1",
        userAgent: "vitest",
      });
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});

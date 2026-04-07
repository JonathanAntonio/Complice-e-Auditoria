import { describe, expect, it, vi } from "vitest";
import { AuthHandlers } from "./auth.handlers";

function createHandlers() {
  return new AuthHandlers({
    startOAuthUseCase: { execute: vi.fn() } as never,
    completeOAuthCallbackUseCase: { execute: vi.fn() } as never,
    getCurrentUserUseCase: { execute: vi.fn() } as never,
    logoutUseCase: { execute: vi.fn() } as never,
    cookieSessionService: {
      readSessionToken: vi.fn(),
      writeSessionCookie: vi.fn(),
      clearSessionCookie: vi.fn(),
    } as never,
    explicitPublicBaseUrl: "https://app.example.com",
  });
}

describe("AuthHandlers", () => {
  it("redirects with auth error when oauth callback has no code/state", () => {
    const handlers = createHandlers();
    const req = { query: {} } as never;
    const res = { redirect: vi.fn() } as never;

    handlers.googleCallback(req, res);

    expect(res.redirect).toHaveBeenCalledWith(
      302,
      "https://app.example.com/?auth_error=Missing+code%2Fstate+on+OAuth+callback&auth_provider=google"
    );
  });

  it("returns 401 when session cookie is missing", async () => {
    const handlers = createHandlers();
    const req = {} as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue(null);

    handlers.me(req, res);
    await Promise.resolve();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Não autenticado",
      message: "Não autenticado",
    });
  });
});

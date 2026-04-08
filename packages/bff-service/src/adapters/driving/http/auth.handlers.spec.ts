import { describe, expect, it, vi } from "vitest";
import { AuthHandlers } from "./auth.handlers";

function createHandlers() {
  return new AuthHandlers({
    startOAuthUseCase: { execute: vi.fn() } as never,
    completeOAuthCallbackUseCase: { execute: vi.fn() } as never,
    getCurrentUserUseCase: { execute: vi.fn() } as never,
    logoutUseCase: { execute: vi.fn() } as never,
    createComplianceViolationUseCase: { execute: vi.fn() } as never,
    updateComplianceViolationUseCase: { execute: vi.fn() } as never,
    listComplianceViolationsUseCase: { execute: vi.fn() } as never,
    listAuditLogsUseCase: { execute: vi.fn() } as never,
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

  it("returns 401 on compliance violations list when session cookie is missing", async () => {
    const handlers = createHandlers();
    const req = {} as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue(null);

    handlers.listComplianceViolations(req, res);
    await Promise.resolve();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Não autenticado",
      message: "Não autenticado",
    });
  });

  it("returns 401 on compliance violation create when session cookie is missing", async () => {
    const handlers = createHandlers();
    const req = { body: { title: "Acesso indevido", severity: "alta" } } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue(null);

    handlers.createComplianceViolation(req, res);
    await Promise.resolve();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Não autenticado",
      message: "Não autenticado",
    });
  });

  it("returns 401 on audit logs list when session cookie is missing", async () => {
    const handlers = createHandlers();
    const req = { query: {} } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue(null);

    handlers.listAuditLogs(req, res);
    await Promise.resolve();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Não autenticado",
      message: "Não autenticado",
    });
  });

  it("returns 401 on compliance violation update when session cookie is missing", async () => {
    const handlers = createHandlers();
    const req = { params: { violationId: "v-1" }, body: { title: "Novo", severity: "media" } } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue(null);

    handlers.updateComplianceViolation(req, res);
    await Promise.resolve();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Não autenticado",
      message: "Não autenticado",
    });
  });

  it("returns 400 on compliance violation create when payload is invalid", async () => {
    const handlers = createHandlers();
    const req = { body: { title: "ab", severity: "invalida" } } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue("token");

    handlers.createComplianceViolation(req, res);
    await Promise.resolve();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Payload inválido para criação de violação",
      message: "Payload inválido para criação de violação",
    });
  });

  it("creates compliance violation when session and payload are valid", async () => {
    const handlers = createHandlers();
    const req = { body: { title: "Acesso indevido", severity: "alta" } } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue("token");
    (handlers as never).deps.createComplianceViolationUseCase.execute.mockResolvedValue({ id: "item-1" });

    handlers.createComplianceViolation(req, res);
    await Promise.resolve();

    expect((handlers as never).deps.createComplianceViolationUseCase.execute).toHaveBeenCalledWith("token", {
      title: "Acesso indevido",
      severity: "alta",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: "item-1" });
  });

  it("updates compliance violation when session and payload are valid", async () => {
    const handlers = createHandlers();
    const req = {
      params: { violationId: "item-1" },
      body: { title: "Acesso revisado", severity: "media" },
    } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue("token");
    (handlers as never).deps.updateComplianceViolationUseCase.execute.mockResolvedValue({ id: "item-1" });

    handlers.updateComplianceViolation(req, res);
    await Promise.resolve();

    expect((handlers as never).deps.updateComplianceViolationUseCase.execute).toHaveBeenCalledWith("token", "item-1", {
      title: "Acesso revisado",
      severity: "media",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: "item-1" });
  });
});

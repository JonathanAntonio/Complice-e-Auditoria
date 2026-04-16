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
    listAuditRetentionRunsUseCase: { execute: vi.fn() } as never,
    listComplianceRetentionRunsUseCase: { execute: vi.fn() } as never,
    listRiskScoresUseCase: { execute: vi.fn() } as never,
    getRiskScoreHistoryUseCase: { execute: vi.fn() } as never,
    ingestRiskEventUseCase: { execute: vi.fn() } as never,
    createReportExportUseCase: { execute: vi.fn() } as never,
    getReportExportUseCase: { execute: vi.fn() } as never,
    downloadReportExportUseCase: { execute: vi.fn() } as never,
    dispatchNotificationUseCase: { execute: vi.fn() } as never,
    listNotificationLogsUseCase: { execute: vi.fn() } as never,
    listAdminUsersUseCase: { execute: vi.fn() } as never,
    getAdminUserUseCase: { execute: vi.fn() } as never,
    createAdminUserUseCase: { execute: vi.fn() } as never,
    updateAdminUserRolesUseCase: { execute: vi.fn() } as never,
    updateAdminUserSecurityUseCase: { execute: vi.fn() } as never,
    deactivateAdminUserUseCase: { execute: vi.fn() } as never,
    publishIntegrationEventUseCase: { execute: vi.fn() } as never,
    integrationAuditPublisher: { publish: vi.fn() } as never,
    cookieSessionService: {
      readSessionToken: vi.fn(),
      writeSessionCookie: vi.fn(),
      clearSessionCookie: vi.fn(),
    } as never,
    explicitPublicBaseUrl: "https://app.example.com",
  });
}

async function flushAsync(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
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
    await flushAsync();

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
    await flushAsync();

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
    await flushAsync();

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
    await flushAsync();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Não autenticado",
      message: "Não autenticado",
    });
  });

  it("returns 401 on audit retention runs list when session cookie is missing", async () => {
    const handlers = createHandlers();
    const req = { query: {} } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue(null);

    handlers.listAuditRetentionRuns(req, res);
    await flushAsync();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Não autenticado",
      message: "Não autenticado",
    });
  });

  it("returns 401 on compliance retention runs list when session cookie is missing", async () => {
    const handlers = createHandlers();
    const req = { query: {} } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue(null);

    handlers.listComplianceRetentionRuns(req, res);
    await flushAsync();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Não autenticado",
      message: "Não autenticado",
    });
  });

  it("returns 401 on risk scores list when session cookie is missing", async () => {
    const handlers = createHandlers();
    const req = { query: {} } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue(null);

    handlers.listRiskScores(req, res);
    await flushAsync();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Não autenticado",
      message: "Não autenticado",
    });
  });

  it("returns 401 on report export create when session cookie is missing", async () => {
    const handlers = createHandlers();
    const req = { body: { format: "csv", scope: "audit" } } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue(null);

    handlers.createReportExport(req, res);
    await flushAsync();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Não autenticado",
      message: "Não autenticado",
    });
  });

  it("returns 401 on notification dispatch when session cookie is missing", async () => {
    const handlers = createHandlers();
    const req = {
      body: { channel: "email", recipient: "x@y.com", severity: "high", message: "Ação necessária" },
    } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue(null);

    handlers.dispatchNotification(req, res);
    await flushAsync();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Não autenticado",
      message: "Não autenticado",
    });
  });

  it("returns 401 on notification logs list when session cookie is missing", async () => {
    const handlers = createHandlers();
    const req = {} as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue(null);

    handlers.listNotificationLogs(req, res);
    await flushAsync();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Não autenticado",
      message: "Não autenticado",
    });
  });

  it("returns 401 on admin users list when session cookie is missing", async () => {
    const handlers = createHandlers();
    const req = { query: {} } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue(null);

    handlers.listAdminUsers(req, res);
    await flushAsync();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Não autenticado",
      message: "Não autenticado",
    });
  });

  it("returns 401 on admin user create when session cookie is missing", async () => {
    const handlers = createHandlers();
    const req = { body: { email: "u@example.com", name: "User" } } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue(null);

    handlers.createAdminUser(req, res);
    await flushAsync();

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
    await flushAsync();

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
    await flushAsync();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Payload inválido para criação de violação",
      message: "Payload inválido para criação de violação",
    });
  });

  it("returns 400 on report export create when payload is invalid", async () => {
    const handlers = createHandlers();
    const req = { body: { format: "xlsx", scope: "invalid" } } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue("token");

    handlers.createReportExport(req, res);
    await flushAsync();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Payload inválido para exportação",
      message: "Payload inválido para exportação",
    });
  });

  it("creates report export when session and payload are valid", async () => {
    const handlers = createHandlers();
    const req = { body: { format: "csv", scope: "audit" } } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue("token");
    (handlers as never).deps.createReportExportUseCase.execute.mockResolvedValue({ id: "rep-1", status: "completed" });

    handlers.createReportExport(req, res);
    await flushAsync();

    expect((handlers as never).deps.createReportExportUseCase.execute).toHaveBeenCalledWith("token", {
      format: "csv",
      scope: "audit",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: "rep-1", status: "completed" });
  });

  it("returns 400 on notification dispatch when payload is invalid", async () => {
    const handlers = createHandlers();
    const req = { body: { channel: "sms", recipient: "", severity: "x", message: "" } } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue("token");

    handlers.dispatchNotification(req, res);
    await flushAsync();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Payload inválido para envio de notificação",
      message: "Payload inválido para envio de notificação",
    });
  });

  it("dispatches notification when session and payload are valid", async () => {
    const handlers = createHandlers();
    const req = {
      body: { channel: "email", recipient: "ops@example.com", severity: "high", message: "Escalar incidente" },
    } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    (handlers as never).deps.cookieSessionService.readSessionToken.mockReturnValue("token");
    (handlers as never).deps.dispatchNotificationUseCase.execute.mockResolvedValue({ id: "n-1", status: "sent" });

    handlers.dispatchNotification(req, res);
    await flushAsync();

    expect((handlers as never).deps.dispatchNotificationUseCase.execute).toHaveBeenCalledWith("token", {
      channel: "email",
      recipient: "ops@example.com",
      severity: "high",
      message: "Escalar incidente",
    });
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ id: "n-1", status: "sent" });
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
    await flushAsync();

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
    await flushAsync();

    expect((handlers as never).deps.updateComplianceViolationUseCase.execute).toHaveBeenCalledWith("token", "item-1", {
      title: "Acesso revisado",
      severity: "media",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: "item-1" });
  });
});

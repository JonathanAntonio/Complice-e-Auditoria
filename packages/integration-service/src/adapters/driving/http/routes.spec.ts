import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { createIntegrationRoutes } from "./routes";

function createMetricsStub() {
  return {
    eventsReceivedTotal: { inc: vi.fn() },
    eventsAcceptedTotal: { inc: vi.fn() },
    eventsRejectedTotal: { inc: vi.fn() },
    eventsDuplicateTotal: { inc: vi.fn() },
    rateLimitedTotal: { inc: vi.fn() },
  } as const;
}

function createMockResponse(): Response {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;
  (res.status as unknown as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return res;
}

function getHandler(route: ReturnType<typeof createIntegrationRoutes>, path: string, method: string) {
  const layer = route.stack.find(
    (item) => item.route?.path === path && item.route?.methods[method]
  );
  if (!layer?.route?.stack) {
    throw new Error(`${method.toUpperCase()} ${path} route handler not found`);
  }
  return layer.route.stack[layer.route.stack.length - 1].handle as (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
}

describe("createIntegrationRoutes", () => {
  const complianceBaseUrl = "http://compliance-service";
  const riskBaseUrl = "http://risk-service";
  const auditBaseUrl = "http://audit-service";
  const jwtSecret = "test-secret-at-least-32-characters-long";

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("writes accepted audit with response status/time", async () => {
    const repository = {
      storeInboundAndOutbox: vi.fn().mockResolvedValue({ duplicate: false }),
      appendAuditEvent: vi.fn().mockResolvedValue(undefined),
    };
    const metrics = createMetricsStub();
    const route = createIntegrationRoutes(
      repository as never,
      metrics as never,
      "valid-key",
      complianceBaseUrl,
      riskBaseUrl,
      auditBaseUrl,
      jwtSecret
    );
    const handler = getHandler(route, "/integrations/events", "post");

    const req = {
      body: {
        eventId: "11111111-1111-4111-8111-111111111111",
        type: "external.invoice.created",
        occurredAtUTC: "2026-05-21T12:00:00.000Z",
        producer: "erp-system",
        correlationId: "corr-123",
        payload: { amount: 100 },
        version: "1.0",
      },
      headers: { "x-api-key": "valid-key" },
      method: "POST",
      path: "/integrations/events",
      ip: "127.0.0.1",
    } as unknown as Request;
    const res = createMockResponse();

    await handler(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(202);
    expect(repository.appendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "integration.audit.accepted",
        payload: expect.objectContaining({
          responseStatus: 202,
          responseTimeMs: expect.any(Number),
          method: "POST",
          path: "/integrations/events",
        }),
      })
    );
  });

  it("writes duplicate audit with response status/time", async () => {
    const repository = {
      storeInboundAndOutbox: vi.fn().mockResolvedValue({ duplicate: true }),
      appendAuditEvent: vi.fn().mockResolvedValue(undefined),
    };
    const metrics = createMetricsStub();
    const route = createIntegrationRoutes(
      repository as never,
      metrics as never,
      "valid-key",
      complianceBaseUrl,
      riskBaseUrl,
      auditBaseUrl,
      jwtSecret
    );
    const handler = getHandler(route, "/integrations/events", "post");

    const req = {
      body: {
        eventId: "11111111-1111-4111-8111-111111111111",
        type: "external.invoice.created",
        occurredAtUTC: "2026-05-21T12:00:00.000Z",
        producer: "erp-system",
        correlationId: "corr-123",
        payload: { amount: 100 },
        version: "1.0",
      },
      headers: { "x-api-key": "valid-key" },
      method: "POST",
      path: "/integrations/events",
      ip: "127.0.0.1",
    } as unknown as Request;
    const res = createMockResponse();

    await handler(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(repository.appendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "integration.audit.duplicate",
        payload: expect.objectContaining({
          responseStatus: 200,
          responseTimeMs: expect.any(Number),
          method: "POST",
          path: "/integrations/events",
        }),
      })
    );
  });

  it("writes rejected audit when api key is invalid", async () => {
    const repository = {
      storeInboundAndOutbox: vi.fn(),
      appendAuditEvent: vi.fn().mockResolvedValue(undefined),
    };
    const metrics = createMetricsStub();
    const route = createIntegrationRoutes(
      repository as never,
      metrics as never,
      "valid-key",
      complianceBaseUrl,
      riskBaseUrl,
      auditBaseUrl,
      jwtSecret
    );
    const handler = getHandler(route, "/integrations/events", "post");

    const req = {
      body: {
        eventId: "11111111-1111-4111-8111-111111111111",
        type: "external.invoice.created",
        occurredAtUTC: "2026-05-21T12:00:00.000Z",
        producer: "erp-system",
        correlationId: "corr-123",
        payload: { amount: 100 },
        version: "1.0",
      },
      headers: { "x-api-key": "invalid-key" },
      method: "POST",
      path: "/integrations/events",
      ip: "127.0.0.1",
    } as unknown as Request;
    const res = createMockResponse();

    await handler(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(repository.storeInboundAndOutbox).not.toHaveBeenCalled();
    expect(repository.appendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "integration.audit.rejected",
        payload: expect.objectContaining({
          reason: "unauthorized",
          responseStatus: 401,
          responseTimeMs: expect.any(Number),
          method: "POST",
          path: "/integrations/events",
        }),
      })
    );
  });

  describe("proxied integration routes", () => {
    it("GET /integrations/compliance/violations returns 401 with missing api key", async () => {
      const route = createIntegrationRoutes(
        {} as never,
        createMetricsStub() as never,
        "valid-key",
        complianceBaseUrl,
        riskBaseUrl,
        auditBaseUrl,
        jwtSecret
      );
      const handler = getHandler(route, "/integrations/compliance/violations", "get");
      const req = { headers: {} } as unknown as Request;
      const res = createMockResponse();

      await handler(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("GET /integrations/compliance/violations proxies request successfully with jwt", async () => {
      const mockViolations = [{ id: "violation-1", name: "GDPR breach" }];
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockViolations,
      });
      vi.stubGlobal("fetch", fetchMock);

      const route = createIntegrationRoutes(
        {} as never,
        createMetricsStub() as never,
        "valid-key",
        complianceBaseUrl,
        riskBaseUrl,
        auditBaseUrl,
        jwtSecret
      );
      const handler = getHandler(route, "/integrations/compliance/violations", "get");
      const req = {
        headers: { "x-api-key": "valid-key" },
        query: { limit: "10" },
      } as unknown as Request;
      const res = createMockResponse();

      await handler(req, res, vi.fn());

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`${complianceBaseUrl}/violations?limit=10`),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Bearer .+/),
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockViolations);
    });

    it("POST /integrations/compliance/violations proxies request successfully with body", async () => {
      const mockResponse = { id: "violation-2", status: "created" };
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });
      vi.stubGlobal("fetch", fetchMock);

      const route = createIntegrationRoutes(
        {} as never,
        createMetricsStub() as never,
        "valid-key",
        complianceBaseUrl,
        riskBaseUrl,
        auditBaseUrl,
        jwtSecret
      );
      const handler = getHandler(route, "/integrations/compliance/violations", "post");
      const req = {
        headers: { "x-api-key": "valid-key" },
        body: { description: "Leak", severity: "high" },
      } as unknown as Request;
      const res = createMockResponse();

      await handler(req, res, vi.fn());

      expect(fetchMock).toHaveBeenCalledWith(
        `${complianceBaseUrl}/violations`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Bearer .+/),
          }),
          body: JSON.stringify({ description: "Leak", severity: "high" }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it("GET /integrations/risk/scores proxies request successfully", async () => {
      const mockScores = { scores: [78] };
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockScores,
      });
      vi.stubGlobal("fetch", fetchMock);

      const route = createIntegrationRoutes(
        {} as never,
        createMetricsStub() as never,
        "valid-key",
        complianceBaseUrl,
        riskBaseUrl,
        auditBaseUrl,
        jwtSecret
      );
      const handler = getHandler(route, "/integrations/risk/scores", "get");
      const req = {
        headers: { "x-api-key": "valid-key" },
        query: { entityType: "user" },
      } as unknown as Request;
      const res = createMockResponse();

      await handler(req, res, vi.fn());

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`${riskBaseUrl}/risk/scores?entityType=user`),
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockScores);
    });

    it("GET /integrations/audit/logs proxies request successfully", async () => {
      const mockLogs = { logs: [] };
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockLogs,
      });
      vi.stubGlobal("fetch", fetchMock);

      const route = createIntegrationRoutes(
        {} as never,
        createMetricsStub() as never,
        "valid-key",
        complianceBaseUrl,
        riskBaseUrl,
        auditBaseUrl,
        jwtSecret
      );
      const handler = getHandler(route, "/integrations/audit/logs", "get");
      const req = {
        headers: { "x-api-key": "valid-key" },
        query: {},
      } as unknown as Request;
      const res = createMockResponse();

      await handler(req, res, vi.fn());

      expect(fetchMock).toHaveBeenCalledWith(
        `${auditBaseUrl}/audit/logs`,
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Bearer .+/),
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockLogs);
    });
  });
});

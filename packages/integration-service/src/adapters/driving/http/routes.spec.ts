import { describe, expect, it, vi } from "vitest";
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

function getPostHandler(route: ReturnType<typeof createIntegrationRoutes>) {
  const layer = route.stack.find((item) => item.route?.path === "/integrations/events");
  if (!layer?.route?.stack) {
    throw new Error("POST /integrations/events route handler not found");
  }
  return layer.route.stack[layer.route.stack.length - 1].handle as (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
}

describe("createIntegrationRoutes", () => {
  it("writes accepted audit with response status/time", async () => {
    const repository = {
      storeInboundAndOutbox: vi.fn().mockResolvedValue({ duplicate: false }),
      appendAuditEvent: vi.fn().mockResolvedValue(undefined),
    };
    const metrics = createMetricsStub();
    const route = createIntegrationRoutes(repository as never, metrics as never, "valid-key");
    const handler = getPostHandler(route);

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
    const route = createIntegrationRoutes(repository as never, metrics as never, "valid-key");
    const handler = getPostHandler(route);

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
    const route = createIntegrationRoutes(repository as never, metrics as never, "valid-key");
    const handler = getPostHandler(route);

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
});

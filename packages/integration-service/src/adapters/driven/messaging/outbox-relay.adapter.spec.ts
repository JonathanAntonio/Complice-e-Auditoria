import { describe, expect, it, vi, beforeEach } from "vitest";
import { OutboxStatus } from "../../../../generated/prisma-client";
import { OutboxRelayAdapter } from "./outbox-relay.adapter";
import { logger } from "@lframework/shared";

describe("OutboxRelayAdapter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("emits outbound published audit event with responseTimeMs on success", async () => {
    const prisma = {
      outboxModel: {
        updateMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 0 })
          .mockResolvedValueOnce({ count: 1 }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "outbox-1",
            payload: {
              eventId: "11111111-1111-4111-8111-111111111111",
              type: "integration.event",
              occurredAtUTC: "2026-05-21T12:00:00.000Z",
              producer: "integration-service",
              correlationId: "corr-1",
              payload: {},
              version: "1.0",
            },
            eventName: "integration.event",
            retryCount: 0,
            createdAt: new Date(),
          },
        ]),
        update: vi.fn().mockResolvedValue({}),
      },
    } as never;

    const eventPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    } as never;

    const metrics = {
      publishSuccessTotal: { inc: vi.fn() },
      publishFailedTotal: { inc: vi.fn() },
      retriesTotal: { inc: vi.fn() },
      deadLetterTotal: { inc: vi.fn() },
    } as never;

    const loggerInfoSpy = vi.spyOn(logger, "info").mockImplementation(() => logger);

    const relay = new OutboxRelayAdapter(prisma, eventPublisher, metrics);
    await relay.runOnce();

    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    expect(metrics.publishSuccessTotal.inc).toHaveBeenCalledTimes(1);
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        audit: true,
        eventType: "integration.audit.outbound.published",
        outboxId: "outbox-1",
        status: "published",
        responseTimeMs: expect.any(Number),
      }),
      "Integration outbound publish audit"
    );
  });

  it("emits outbound retry audit event when publish fails and retry is scheduled", async () => {
    const prisma = {
      outboxModel: {
        updateMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 0 })
          .mockResolvedValueOnce({ count: 1 }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "outbox-2",
            payload: {
              eventId: "22222222-2222-4222-8222-222222222222",
              type: "integration.event",
              occurredAtUTC: "2026-05-21T12:00:00.000Z",
              producer: "integration-service",
              correlationId: "corr-2",
              payload: {},
              version: "1.0",
            },
            eventName: "integration.event",
            retryCount: 0,
            createdAt: new Date(),
          },
        ]),
        update: vi.fn().mockResolvedValue({}),
      },
    } as never;

    const eventPublisher = {
      publish: vi.fn().mockRejectedValue(new Error("broker unavailable")),
    } as never;

    const metrics = {
      publishSuccessTotal: { inc: vi.fn() },
      publishFailedTotal: { inc: vi.fn() },
      retriesTotal: { inc: vi.fn() },
      deadLetterTotal: { inc: vi.fn() },
    } as never;

    const loggerInfoSpy = vi.spyOn(logger, "info").mockImplementation(() => logger);

    const relay = new OutboxRelayAdapter(prisma, eventPublisher, metrics, 50, 5);
    await relay.runOnce();

    expect(metrics.publishFailedTotal.inc).toHaveBeenCalledTimes(1);
    expect(metrics.retriesTotal.inc).toHaveBeenCalledTimes(1);
    expect(prisma.outboxModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "outbox-2" },
        data: expect.objectContaining({
          status: OutboxStatus.pending,
          retryCount: 1,
        }),
      })
    );
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        audit: true,
        eventType: "integration.audit.outbound.retry",
        outboxId: "outbox-2",
        status: "retry_scheduled",
        responseTimeMs: expect.any(Number),
      }),
      "Integration outbound publish audit"
    );
  });
});

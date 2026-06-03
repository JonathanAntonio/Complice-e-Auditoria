import { describe, expect, it, vi } from "vitest";
import type { EventEnvelopeV1 } from "@lframework/shared";
import { PrismaAuditLogRepository } from "./prisma-audit-log.repository";

function makeEnvelope(overrides?: Partial<EventEnvelopeV1>): EventEnvelopeV1 {
  return {
    eventId: "11111111-1111-4111-8111-111111111111",
    type: "identity.user.updated",
    occurredAtUTC: "2026-05-21T12:00:00.000Z",
    producer: "identity-service",
    correlationId: "corr-1",
    version: "1.0",
    payload: { severity: "high", actorId: "user-1" },
    ...overrides,
  };
}

describe("PrismaAuditLogRepository", () => {
  it("normalizes required audit payload fields before persisting", async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    const prisma = {
      auditLogModel: { create },
    } as unknown as ConstructorParameters<typeof PrismaAuditLogRepository>[0];

    const repository = new PrismaAuditLogRepository(prisma);
    await repository.saveFromEnvelope(makeEnvelope({ payload: { severity: "critical" } }));

    const arg = create.mock.calls[0][0];
    const persistedPayload = arg.data.payload as Record<string, unknown>;

    expect(persistedPayload.action).toBe("identity.user.updated");
    expect(persistedPayload.entity).toBe("unknown");
    expect(persistedPayload.ipAddress).toBe("unknown");
    expect((persistedPayload.auditContext as Record<string, unknown>).eventId).toBe(
      "11111111-1111-4111-8111-111111111111"
    );
  });

  it("persists system actor fallback when actor id is missing", async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    const prisma = {
      auditLogModel: { create },
    } as unknown as ConstructorParameters<typeof PrismaAuditLogRepository>[0];

    const repository = new PrismaAuditLogRepository(prisma);
    await repository.saveFromEnvelope(makeEnvelope({ payload: { severity: "medium" }, producer: "integration-service" }));

    const arg = create.mock.calls[0][0];
    expect(arg.data.actorId).toBe("system:integration-service");
    expect(arg.data.actorType).toBe("system");
  });

  it("ignores duplicate event id errors (P2002)", async () => {
    const create = vi.fn().mockRejectedValue({ code: "P2002" });
    const prisma = {
      auditLogModel: { create },
    } as unknown as ConstructorParameters<typeof PrismaAuditLogRepository>[0];

    const repository = new PrismaAuditLogRepository(prisma);

    await expect(repository.saveFromEnvelope(makeEnvelope())).resolves.toBeUndefined();
    expect(create).toHaveBeenCalledTimes(1);
  });
});

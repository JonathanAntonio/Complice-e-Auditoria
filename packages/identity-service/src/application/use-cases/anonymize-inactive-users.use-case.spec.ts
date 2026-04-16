import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { AnonymizeInactiveUsersUseCase } from "./anonymize-inactive-users.use-case";
import { SECURITY_AUDIT_EVENTS } from "../security-audit";

describe("AnonymizeInactiveUsersUseCase", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-08T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("applies retention window and anonymizes only non-redacted candidates", async () => {
    const queryRaw = vi.fn().mockResolvedValue([
      { id: "u-1", email: "user1@example.com" },
      { id: "u-2", email: "anon+u-2@redacted.local" },
    ]);
    const executeRaw = vi.fn().mockResolvedValue(1);
    const prisma = {
      $queryRaw: queryRaw,
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<void>) => {
        await callback({ $executeRaw: executeRaw });
      }),
    };
    const outboxRepository = {
      append: vi.fn().mockResolvedValue(undefined),
    };
    const useCase = new AnonymizeInactiveUsersUseCase(prisma as never, outboxRepository as never);

    const result = await useCase.execute({ retentionDays: 10, batchSize: 50 });

    expect(result.scanned).toBe(2);
    expect(result.anonymized).toBe(1);
    expect(result.cutoffIso).toBe("2024-04-08T12:00:00.000Z");
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(executeRaw).toHaveBeenCalledTimes(1);
    expect(outboxRepository.append).toHaveBeenCalledTimes(1);
    expect(outboxRepository.append).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: SECURITY_AUDIT_EVENTS.USER_DATA_ANONYMIZED,
        payload: expect.objectContaining({
          targetUserId: "u-1",
          previousEmail: "user1@example.com",
          anonymizedEmail: "anon+u-1@redacted.local",
          reason: "inactive_user_retention",
        }),
      }),
      expect.anything()
    );
  });

  it("clamps batch size to maximum supported value", async () => {
    const queryRaw = vi.fn().mockResolvedValue([]);
    const prisma = {
      $queryRaw: queryRaw,
      $transaction: vi.fn(),
    };
    const outboxRepository = {
      append: vi.fn().mockResolvedValue(undefined),
    };
    const useCase = new AnonymizeInactiveUsersUseCase(prisma as never, outboxRepository as never);

    await useCase.execute({ retentionDays: 730, batchSize: 9999 });

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(queryRaw.mock.calls[0]?.[2]).toBe(500);
  });
});

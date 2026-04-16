import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaReplicatedUserStore } from "./prisma-replicated-user.store";

describe("PrismaReplicatedUserStore", () => {
  const mockExecuteRawUnsafe = vi.fn();
  const mockQueryRawUnsafe = vi.fn();
  const mockPrisma = {
    $executeRawUnsafe: mockExecuteRawUnsafe,
    $queryRawUnsafe: mockQueryRawUnsafe,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates row when user does not exist", async () => {
    mockExecuteRawUnsafe.mockResolvedValueOnce(0).mockResolvedValueOnce(undefined);
    mockQueryRawUnsafe.mockResolvedValue([]);

    const store = new PrismaReplicatedUserStore(mockPrisma as never);
    const payload = {
      userId: "user-1",
      email: "u@example.com",
      name: "User One",
      occurredAt: "2025-01-15T10:00:00.000Z",
    };

    await store.upsertFromUserCreated(payload);

    expect(mockExecuteRawUnsafe).toHaveBeenCalledTimes(2);
    expect(mockQueryRawUnsafe).toHaveBeenCalledTimes(1);
  });

  it("updates row when user exists and event is newer or equal", async () => {
    mockExecuteRawUnsafe.mockResolvedValueOnce(1);

    const store = new PrismaReplicatedUserStore(mockPrisma as never);
    const payload = {
      userId: "user-2",
      email: "updated@example.com",
      name: "Updated Name",
      occurredAt: "2025-02-01T12:00:00.000Z",
    };

    await store.upsertFromUserCreated(payload);

    expect(mockExecuteRawUnsafe).toHaveBeenCalledTimes(1);
    expect(mockQueryRawUnsafe).not.toHaveBeenCalled();
  });

  it("skips when user exists with newer lastEventOccurredAt (stale event)", async () => {
    mockExecuteRawUnsafe.mockResolvedValueOnce(0);
    mockQueryRawUnsafe.mockResolvedValue([{ id: "user-3" }]);

    const store = new PrismaReplicatedUserStore(mockPrisma as never);
    const payload = {
      userId: "user-3",
      email: "stale@example.com",
      name: "Stale Name",
      occurredAt: "2025-02-01T12:00:00.000Z",
    };

    await store.upsertFromUserCreated(payload);

    expect(mockExecuteRawUnsafe).toHaveBeenCalledTimes(1);
    expect(mockQueryRawUnsafe).toHaveBeenCalledTimes(1);
  });
});

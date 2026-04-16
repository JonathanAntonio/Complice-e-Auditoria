import { describe, expect, it, vi } from "vitest";
import { RunRetentionSweepUseCase } from "./run-retention-sweep.use-case";

describe("RunRetentionSweepUseCase", () => {
  it("enforces minimum retention and records monitor-only run", async () => {
    const query = vi.fn().mockResolvedValue([
      {
        id: "v-1",
        resolvedAt: new Date("2020-01-01T00:00:00.000Z"),
        dismissedAt: null,
        retentionUntil: null,
      },
    ]);
    const exec = vi.fn().mockResolvedValue(undefined);
    const useCase = new RunRetentionSweepUseCase({
      $queryRawUnsafe: query,
      $executeRawUnsafe: exec,
    });

    const result = await useCase.execute({ retentionDays: 10, batchSize: 1 });

    expect(result.retentionDays).toBe(1825);
    expect(result.eligibleCount).toBe(1);
    expect(result.monitorOnlyCount).toBe(1);
    expect(result.scopedStatuses).toEqual(["resolvida", "dispensada"]);
    expect(exec).toHaveBeenCalled();
    expect(query).toHaveBeenCalled();
  });

  it("uses configured scoped statuses when provided", async () => {
    const query = vi.fn().mockResolvedValue([]);
    const exec = vi.fn().mockResolvedValue(undefined);
    const useCase = new RunRetentionSweepUseCase({
      $queryRawUnsafe: query,
      $executeRawUnsafe: exec,
    });

    const result = await useCase.execute({
      retentionDays: 1825,
      batchSize: 5,
      scopedStatuses: ["resolvida"],
    });

    expect(result.scopedStatuses).toEqual(["resolvida"]);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0]?.[3]).toEqual(["resolvida"]);
  });
});

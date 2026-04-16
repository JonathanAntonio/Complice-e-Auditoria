import { describe, expect, it, vi } from "vitest";
import { RunAuditRetentionSweepUseCase } from "./run-retention-sweep.use-case";

describe("RunAuditRetentionSweepUseCase", () => {
  it("applies source_service scope when configured", async () => {
    const query = vi.fn().mockResolvedValue([{ total: 2 }]);
    const exec = vi.fn().mockResolvedValue(undefined);
    const useCase = new RunAuditRetentionSweepUseCase({
      $queryRawUnsafe: query,
      $executeRawUnsafe: exec,
    });

    const result = await useCase.execute({
      retentionDays: 1825,
      batchSize: 100,
      scopedSourceServices: ["integration-service", "bff-service"],
    });

    expect(result.eligibleCount).toBe(2);
    expect(result.scopedSourceServices).toEqual(["integration-service", "bff-service"]);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0]?.[3]).toEqual(["integration-service", "bff-service"]);
  });
});

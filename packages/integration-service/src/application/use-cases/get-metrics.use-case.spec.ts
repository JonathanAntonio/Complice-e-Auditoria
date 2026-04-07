import { describe, expect, it, vi } from "vitest";
import { GetMetricsUseCase } from "./get-metrics.use-case";

describe("GetMetricsUseCase", () => {
  it("returns metrics payload with content type", async () => {
    const metricsReader = {
      contentType: "text/plain",
      metrics: vi.fn().mockResolvedValue("metric 1"),
    };
    const useCase = new GetMetricsUseCase(metricsReader);

    const result = await useCase.execute();

    expect(result).toEqual({ contentType: "text/plain", body: "metric 1" });
    expect(metricsReader.metrics).toHaveBeenCalledTimes(1);
  });
});

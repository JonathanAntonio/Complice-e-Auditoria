import { describe, expect, it, vi } from "vitest";
import { MetricsController } from "./metrics.controller";

describe("MetricsController", () => {
  it("writes metrics response with proper content type", async () => {
    const getMetricsUseCase = {
      execute: vi.fn().mockResolvedValue({
        contentType: "text/plain",
        body: "metric 1",
      }),
    } as never;
    const controller = new MetricsController(getMetricsUseCase);

    const res = {
      set: vi.fn(),
      end: vi.fn(),
    } as never;

    await controller.get({} as never, res);

    expect(getMetricsUseCase.execute).toHaveBeenCalledTimes(1);
    expect(res.set).toHaveBeenCalledWith("Content-Type", "text/plain");
    expect(res.end).toHaveBeenCalledWith("metric 1");
  });
});

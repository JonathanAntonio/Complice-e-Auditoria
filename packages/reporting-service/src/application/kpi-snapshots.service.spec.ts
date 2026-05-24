import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { KpiSnapshotsService } from "./kpi-snapshots.service";

describe("KpiSnapshotsService", () => {
  it("calculates compliance index using compliant/validated formula", () => {
    const service = new KpiSnapshotsService(() => new Date("2026-05-24T10:00:00.000Z"));
    const snapshot = service.getSnapshot({});

    expect(snapshot.totals.validatedEvents).toBe(5);
    expect(snapshot.totals.compliantEvents).toBe(3);
    expect(snapshot.complianceIndexPercentage).toBe(60);
  });

  it("applies filters and preserves lag <= 60s in current baseline", () => {
    const service = new KpiSnapshotsService(() => new Date("2026-05-24T10:00:00.000Z"));
    const snapshot = service.getSnapshot({
      area: "finance",
      riskLevel: "high",
      violationStatus: "aberta",
      eventType: "invoice_updated",
    });

    expect(snapshot.totals.validatedEvents).toBe(1);
    expect(snapshot.totals.compliantEvents).toBe(0);
    expect(snapshot.complianceIndexPercentage).toBe(0);
    expect(snapshot.sourceLagSeconds).toBeLessThanOrEqual(60);
    expect(snapshot.appliedFilters.area).toBe("finance");
  });

  it("rejects invalid filter values", () => {
    const service = new KpiSnapshotsService();
    expect(() => service.getSnapshot({ period: "2h" })).toThrow(ZodError);
  });
});

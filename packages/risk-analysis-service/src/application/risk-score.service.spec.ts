import { describe, expect, it } from "vitest";
import { RiskScoreService } from "./risk-score.service";

describe("RiskScoreService", () => {
  it("ingests events and lists scores for all entities", () => {
    const service = new RiskScoreService();

    const accepted = service.ingest({
      userId: "user-1",
      area: "finance",
      processType: "approval",
      severity: "high",
    });

    expect(accepted.accepted).toBe(true);
    expect(accepted.updatedAtUTC).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const all = service.list();
    expect(all.items).toHaveLength(3);
    expect(all.total).toBe(3);
    expect(all.items.some((item) => item.entityType === "user" && item.entityId === "user-1" && item.score === 20)).toBe(true);
    expect(all.items.some((item) => item.entityType === "area" && item.entityId === "finance" && item.score === 20)).toBe(true);
    expect(
      all.items.some((item) => item.entityType === "process" && item.entityId === "approval" && item.score === 20)
    ).toBe(true);
  });

  it("filters by entity type and exposes summary", () => {
    const service = new RiskScoreService();
    service.ingest({
      userId: "user-2",
      area: "ops",
      processType: "onboarding",
      severity: "critical",
    });

    const onlyUsers = service.list({ entityType: "user" });
    expect(onlyUsers.items).toHaveLength(1);
    expect(onlyUsers.items[0].entityType).toBe("user");
    expect(onlyUsers.items[0].entityId).toBe("user-2");
    expect(onlyUsers.items[0].level).toBe("medium");
    expect(onlyUsers.summary.mediumCount).toBe(1);
  });

  it("returns history for an entity", () => {
    const service = new RiskScoreService();
    service.ingest({
      userId: "user-7",
      area: "ops",
      processType: "payment",
      severity: "medium",
    });
    service.ingest({
      userId: "user-7",
      area: "ops",
      processType: "payment",
      severity: "high",
    });

    const history = service.historyFor("user", "user-7");
    expect(history.entityType).toBe("user");
    expect(history.entityId).toBe("user-7");
    expect(history.points.length).toBeGreaterThan(0);
  });
});

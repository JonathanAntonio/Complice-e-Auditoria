import { describe, expect, it } from "vitest";
import { Item } from "./item.entity";
import { Money } from "../value-objects/money.vo";

describe("Item entity", () => {
  it("applies valid lifecycle transitions", () => {
    const item = Item.create("v-1", "Violacao", Money.create(200, "BRL"));
    const analysisAt = new Date("2026-01-01T10:00:00.000Z");
    const resolvedAt = new Date("2026-01-01T11:00:00.000Z");

    item.transitionStatus("em_analise", analysisAt);
    item.transitionStatus("resolvida", resolvedAt);

    expect(item.status).toBe("resolvida");
    expect(item.resolvedAt?.toISOString()).toBe("2026-01-01T11:00:00.000Z");
    expect(item.dismissedAt).toBeNull();
  });

  it("rejects invalid transition from aberta directly to resolvida", () => {
    const item = Item.create("v-2", "Violacao", Money.create(100, "BRL"));
    expect(() => item.transitionStatus("resolvida", new Date())).toThrowError(
      "Open violation can only transition to em_analise"
    );
  });
});

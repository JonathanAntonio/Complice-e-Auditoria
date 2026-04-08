import { describe, expect, it } from "vitest";
import { parseListAuditLogsQueryDto } from "../application/dtos/list-audit-logs-query.dto";

describe("parseListAuditLogsQueryDto", () => {
  it("applies defaults", () => {
    expect(parseListAuditLogsQueryDto({})).toEqual({ page: 1, pageSize: 20 });
  });

  it("parses valid query", () => {
    const parsed = parseListAuditLogsQueryDto({
      page: "2",
      pageSize: "10",
      severity: "high",
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-01-02T00:00:00.000Z",
    });

    expect(parsed.page).toBe(2);
    expect(parsed.pageSize).toBe(10);
    expect(parsed.severity).toBe("high");
  });

  it("rejects invalid date range", () => {
    expect(() => parseListAuditLogsQueryDto({
      from: "2026-01-03T00:00:00.000Z",
      to: "2026-01-02T00:00:00.000Z",
    })).toThrow();
  });
});

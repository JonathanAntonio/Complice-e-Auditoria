import { describe, expect, it } from "vitest";
import { createSecurityAuditEvent } from "./security-audit";

describe("createSecurityAuditEvent", () => {
  it("deve preservar occurredAt gerado pelo sistema", () => {
    const event = createSecurityAuditEvent("identity.auth.login_failed", {
      occurredAt: "2000-01-01T00:00:00.000Z",
      reason: "invalid_credentials",
    });

    expect(event.payload).toEqual(
      expect.objectContaining({
        reason: "invalid_credentials",
      })
    );
    expect(event.payload.occurredAt).not.toBe("2000-01-01T00:00:00.000Z");
  });
});

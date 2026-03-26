import { describe, expect, it } from "vitest";
import { createSecurityAuditEvent, SECURITY_AUDIT_EVENTS } from "./security-audit";

describe("createSecurityAuditEvent", () => {
  it("deve preservar occurredAt quando informado pelo caller", () => {
    const event = createSecurityAuditEvent(SECURITY_AUDIT_EVENTS.LOGIN_FAILED, {
      occurredAt: "2000-01-01T00:00:00.000Z",
      reason: "invalid_credentials",
    });

    expect(event.payload).toEqual(
      expect.objectContaining({
        reason: "invalid_credentials",
      })
    );
    expect(event.payload.occurredAt).toBe("2000-01-01T00:00:00.000Z");
  });
});

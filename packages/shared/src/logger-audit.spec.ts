import { afterEach, describe, expect, it, vi } from "vitest";
import { AuditUnavailableError, HttpAuditPublisher, buildAuditPayloadFromLog } from "./logger-audit";

describe("HttpAuditPublisher", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("assertAvailable succeeds when audit health returns 200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
    const publisher = new HttpAuditPublisher("http://audit.test");

    await expect(publisher.assertAvailable()).resolves.toBeUndefined();
  });

  it("assertAvailable throws AuditUnavailableError when health endpoint fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 503 }));
    const publisher = new HttpAuditPublisher("http://audit.test");

    await expect(publisher.assertAvailable()).rejects.toBeInstanceOf(AuditUnavailableError);
  });

  it("publish throws and triggers callback in fail-closed mode", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));
    const onUnavailable = vi.fn();
    const publisher = new HttpAuditPublisher("http://audit.test", { failClosed: true, onUnavailable });

    await expect(
      publisher.publish({
        eventId: "11111111-1111-4111-8111-111111111111",
        type: "system.error",
        occurredAtUTC: "2026-05-21T12:00:00.000Z",
        producer: "service-test",
        correlationId: "corr-1",
        payload: { severity: "high" },
        version: "1.0",
      })
    ).rejects.toBeInstanceOf(AuditUnavailableError);

    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });
});

describe("buildAuditPayloadFromLog", () => {
  it("fills required audit fields when missing", () => {
    const payload = buildAuditPayloadFromLog({}, "identity.user.updated", "identity-service");

    expect(payload.action).toBe("identity.user.updated");
    expect(payload.entity).toBe("unknown");
    expect(payload.ipAddress).toBe("unknown");
    expect(payload.sourceSystem).toBe("identity-service");
    expect(payload.previousValue).toBeNull();
    expect(payload.newValue).toBeNull();
  });

  it("uses explicit and request-derived fields when provided", () => {
    const payload = buildAuditPayloadFromLog(
      {
        action: "user.role.changed",
        entity: "user",
        req: { ip: "10.0.0.8" },
        sourceSystem: "erp-x",
        previousValue: { role: "viewer" },
        newValue: { role: "admin" },
      },
      "ignored.type",
      "identity-service"
    );

    expect(payload.action).toBe("user.role.changed");
    expect(payload.entity).toBe("user");
    expect(payload.ipAddress).toBe("10.0.0.8");
    expect(payload.sourceSystem).toBe("erp-x");
    expect(payload.previousValue).toEqual({ role: "viewer" });
    expect(payload.newValue).toEqual({ role: "admin" });
  });
});

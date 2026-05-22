import { afterEach, describe, expect, it, vi } from "vitest";
import { AuditUnavailableError, HttpAuditPublisher } from "./logger-audit";

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

import { describe, expect, it } from "vitest";
import { NotificationDispatchService } from "./notification-dispatch.service";
import type { NotificationPreference, NotificationPreferencesRepository } from "./notification-preferences.service";
import { NotificationPreferencesService } from "./notification-preferences.service";
import { ZodError } from "zod";

class InMemoryNotificationPreferencesRepository implements NotificationPreferencesRepository {
  private readonly values = new Map<string, NotificationPreference>();

  async upsert(_recipient: string, value: Omit<NotificationPreference, "updatedAtUTC">): Promise<NotificationPreference> {
    const saved: NotificationPreference = {
      ...value,
      updatedAtUTC: new Date().toISOString(),
    };
    this.values.set(saved.recipient, saved);
    return saved;
  }

  async get(recipient: string): Promise<NotificationPreference | null> {
    return this.values.get(recipient) ?? null;
  }
}

describe("NotificationDispatchService", () => {
  it("dispatches notification successfully by default", async () => {
    const service = new NotificationDispatchService();
    const result = await service.dispatch({
      channel: "email",
      recipient: "user@example.com",
      severity: "medium",
      message: "Operational update",
    });

    expect(result?.id).toBeTruthy();
    expect(result?.status).toBe("sent");
    expect(result?.attempts).toBeGreaterThan(0);
    expect(result?.deliveredAtUTC).toBeTruthy();
  });

  it("sends notification to dead letter when forced failures exceed retries", async () => {
    const service = new NotificationDispatchService();
    const result = await service.dispatch({
      channel: "webhook",
      recipient: "https://hooks.example.com/security",
      severity: "high",
      message: "Escalation required",
      maxRetries: 2,
      forceFailAttempts: 2,
    });

    expect(result?.status).toBe("dead_letter");
    expect(result?.attempts).toBe(2);
    expect(result?.lastError).toContain("simulated_failure_attempt");
  });

  it("lists logs in descending order by creation time", async () => {
    const service = new NotificationDispatchService();
    const first = await service.dispatch({
      channel: "email",
      recipient: "first@example.com",
      severity: "low",
      message: "First",
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const second = await service.dispatch({
      channel: "email",
      recipient: "second@example.com",
      severity: "low",
      message: "Second",
    });

    const logs = service.list();
    expect(logs[0].id).toBe(second?.id);
    expect(logs[1].id).toBe(first?.id);
  });

  it("routes critical notification to owner, area manager and compliance officer", async () => {
    const service = new NotificationDispatchService();
    const logs = await service.dispatchMany({
      channel: "email",
      severity: "critical",
      message: "Critical risk detected",
      scopeOwner: "owner@example.com",
      areaManager: "manager@example.com",
      complianceOfficer: "officer@example.com",
    });

    expect(logs).toHaveLength(3);
    expect(new Set(logs.map((l) => l.recipient))).toEqual(
      new Set(["owner@example.com", "manager@example.com", "officer@example.com"])
    );
    expect(logs.every((l) => l.status === "sent")).toBe(true);
    expect(logs.every((l) => l.slaTargetSeconds === 300)).toBe(true);
    expect(logs.every((l) => typeof l.slaDeadlineUTC === "string")).toBe(true);
    expect(logs.every((l) => l.slaBreached === false)).toBe(true);
  });

  it("rejects high severity routing without area manager when recipient is omitted", async () => {
    const service = new NotificationDispatchService();
    await expect(
      service.dispatchMany({
        channel: "email",
        severity: "high",
        message: "High risk detected",
        scopeOwner: "owner@example.com",
      })
    ).rejects.toBeInstanceOf(ZodError);
  });

  it("applies preferences to low/medium notifications", async () => {
    const preferences = new NotificationPreferencesService(new InMemoryNotificationPreferencesRepository());
    await preferences.upsert("owner@example.com", {
      channels: ["webhook"],
      frequency: "immediate",
      grouping: false,
      muteLowMedium: true,
    });
    const service = new NotificationDispatchService(preferences);

    const lowLogs = await service.dispatchMany({
      channel: "email",
      severity: "low",
      message: "Non-critical update",
      recipient: "owner@example.com",
    });
    expect(lowLogs).toHaveLength(0);
  });

  it("does not allow preferences to suppress high/critical notifications", async () => {
    const preferences = new NotificationPreferencesService(new InMemoryNotificationPreferencesRepository());
    await preferences.upsert("manager@example.com", {
      channels: ["webhook"],
      frequency: "daily_digest",
      grouping: true,
      muteLowMedium: true,
    });
    const service = new NotificationDispatchService(preferences);

    const highLogs = await service.dispatchMany({
      channel: "email",
      severity: "high",
      message: "High alert",
      recipient: "manager@example.com",
    });
    const criticalLogs = await service.dispatchMany({
      channel: "email",
      severity: "critical",
      message: "Critical alert",
      recipient: "manager@example.com",
      areaManager: "manager@example.com",
      complianceOfficer: "officer@example.com",
    });

    expect(highLogs).toHaveLength(1);
    expect(criticalLogs).toHaveLength(2);
    expect(highLogs[0]?.status).toBe("sent");
    expect(criticalLogs.every((item) => item.status === "sent")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { NotificationDispatchService } from "./notification-dispatch.service";

describe("NotificationDispatchService", () => {
  it("dispatches notification successfully by default", () => {
    const service = new NotificationDispatchService();
    const result = service.dispatch({
      channel: "email",
      recipient: "user@example.com",
      severity: "medium",
      message: "Operational update",
    });

    expect(result.id).toBeTruthy();
    expect(result.status).toBe("sent");
    expect(result.attempts).toBeGreaterThan(0);
    expect(result.deliveredAtUTC).toBeTruthy();
  });

  it("sends notification to dead letter when forced failures exceed retries", () => {
    const service = new NotificationDispatchService();
    const result = service.dispatch({
      channel: "webhook",
      recipient: "https://hooks.example.com/security",
      severity: "high",
      message: "Escalation required",
      maxRetries: 2,
      forceFailAttempts: 2,
    });

    expect(result.status).toBe("dead_letter");
    expect(result.attempts).toBe(2);
    expect(result.lastError).toContain("simulated_failure_attempt");
  });

  it("lists logs in descending order by creation time", async () => {
    const service = new NotificationDispatchService();
    const first = service.dispatch({
      channel: "email",
      recipient: "first@example.com",
      severity: "low",
      message: "First",
    });

    await new Promise((resolve) => setTimeout(resolve, 1));

    const second = service.dispatch({
      channel: "email",
      recipient: "second@example.com",
      severity: "low",
      message: "Second",
    });

    const logs = service.list();
    expect(logs[0].id).toBe(second.id);
    expect(logs[1].id).toBe(first.id);
  });
});

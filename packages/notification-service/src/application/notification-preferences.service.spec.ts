import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import type { NotificationPreference, NotificationPreferencesRepository } from "./notification-preferences.service";
import { NotificationPreferencesService } from "./notification-preferences.service";

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

describe("NotificationPreferencesService", () => {
  it("upserts and retrieves preferences by normalized recipient", async () => {
    const service = new NotificationPreferencesService(new InMemoryNotificationPreferencesRepository());
    const saved = await service.upsert("User@Example.com", {
      channels: ["email", "webhook", "email"],
      frequency: "hourly_digest",
      grouping: true,
      muteLowMedium: true,
    });

    expect(saved.recipient).toBe("user@example.com");
    expect(saved.channels).toEqual(["email", "webhook"]);
    expect(saved.frequency).toBe("hourly_digest");
    expect(saved.grouping).toBe(true);
    expect(saved.muteLowMedium).toBe(true);

    const found = await service.get(" user@example.com ");
    expect(found).toEqual(saved);
  });

  it("returns null for unknown recipient", async () => {
    const service = new NotificationPreferencesService(new InMemoryNotificationPreferencesRepository());
    expect(await service.get("unknown@example.com")).toBeNull();
  });

  it("rejects invalid payload", async () => {
    const service = new NotificationPreferencesService(new InMemoryNotificationPreferencesRepository());
    await expect(service.upsert("user@example.com", { channels: [] })).rejects.toBeInstanceOf(ZodError);
  });
});

import { z } from "zod";

const channelsSchema = z.array(z.enum(["email", "webhook"])).min(1);
const upsertSchema = z.object({
  channels: channelsSchema,
  frequency: z.enum(["immediate", "hourly_digest", "daily_digest"]).default("immediate"),
  grouping: z.boolean().default(false),
  muteLowMedium: z.boolean().default(false),
});

export interface NotificationPreference {
  recipient: string;
  channels: Array<"email" | "webhook">;
  frequency: "immediate" | "hourly_digest" | "daily_digest";
  grouping: boolean;
  muteLowMedium: boolean;
  updatedAtUTC: string;
}

export interface NotificationPreferencesRepository {
  upsert(recipient: string, value: Omit<NotificationPreference, "updatedAtUTC">): Promise<NotificationPreference>;
  get(recipient: string): Promise<NotificationPreference | null>;
}

export class NotificationPreferencesService {
  constructor(private readonly repository: NotificationPreferencesRepository) {}

  async upsert(recipient: string, raw: unknown): Promise<NotificationPreference> {
    const key = recipient.trim().toLowerCase();
    if (!key) throw new Error("recipient is required");
    const parsed = upsertSchema.parse(raw);

    return this.repository.upsert(key, {
      recipient: key,
      channels: [...new Set(parsed.channels)],
      frequency: parsed.frequency,
      grouping: parsed.grouping,
      muteLowMedium: parsed.muteLowMedium,
    });
  }

  async get(recipient: string): Promise<NotificationPreference | null> {
    const key = recipient.trim().toLowerCase();
    if (!key) return null;
    return this.repository.get(key);
  }
}

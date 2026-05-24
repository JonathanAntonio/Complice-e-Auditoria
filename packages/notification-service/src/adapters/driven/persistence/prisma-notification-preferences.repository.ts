import { PrismaClient } from "@prisma/client";
import type { NotificationPreference } from "../../../application/notification-preferences.service";

export class PrismaNotificationPreferencesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(recipient: string, value: Omit<NotificationPreference, "updatedAtUTC">): Promise<NotificationPreference> {
    const saved = await this.prisma.notificationPreferenceModel.upsert({
      where: { recipient },
      create: {
        recipient,
        channels: value.channels,
        frequency: value.frequency,
        grouping: value.grouping,
        muteLowMedium: value.muteLowMedium,
      },
      update: {
        channels: value.channels,
        frequency: value.frequency,
        grouping: value.grouping,
        muteLowMedium: value.muteLowMedium,
      },
    });
    return {
      recipient: saved.recipient,
      channels: saved.channels.filter(isAllowedChannel),
      frequency: saved.frequency,
      grouping: saved.grouping,
      muteLowMedium: saved.muteLowMedium,
      updatedAtUTC: saved.updatedAt.toISOString(),
    };
  }

  async get(recipient: string): Promise<NotificationPreference | null> {
    const saved = await this.prisma.notificationPreferenceModel.findUnique({
      where: { recipient },
    });
    if (!saved) return null;
    return {
      recipient: saved.recipient,
      channels: saved.channels.filter(isAllowedChannel),
      frequency: saved.frequency,
      grouping: saved.grouping,
      muteLowMedium: saved.muteLowMedium,
      updatedAtUTC: saved.updatedAt.toISOString(),
    };
  }
}

function isAllowedChannel(value: string): value is "email" | "webhook" {
  return value === "email" || value === "webhook";
}

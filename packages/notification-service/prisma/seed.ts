import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();

const PREFERENCES = [
  {
    recipient: "admin@demo.com",
    channels: ["email", "slack"],
    frequency: "immediate" as const,
    grouping: false,
    muteLowMedium: false,
  },
  {
    recipient: "compliance@demo.com",
    channels: ["email"],
    frequency: "immediate" as const,
    grouping: true,
    muteLowMedium: false,
  },
  {
    recipient: "auditor@demo.com",
    channels: ["email"],
    frequency: "daily_digest" as const,
    grouping: true,
    muteLowMedium: true,
  },
  {
    recipient: "gestor@demo.com",
    channels: ["email", "webhook"],
    frequency: "hourly_digest" as const,
    grouping: true,
    muteLowMedium: true,
  },
  {
    recipient: "viewer@demo.com",
    channels: ["email"],
    frequency: "daily_digest" as const,
    grouping: true,
    muteLowMedium: true,
  },
];

async function main() {
  console.log("🌱 Seeding notification-service...");

  for (const pref of PREFERENCES) {
    await prisma.notificationPreferenceModel.upsert({
      where: { recipient: pref.recipient },
      create: pref,
      update: pref,
    });
  }

  console.log(`  ✓ ${PREFERENCES.length} notification preferences`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

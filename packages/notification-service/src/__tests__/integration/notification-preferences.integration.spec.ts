import path from "path";
import { config as loadEnv } from "dotenv";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../../app";
import { createNotificationRoutes } from "../../adapters/driving/http/routes";
import { NotificationDispatchService } from "../../application/notification-dispatch.service";
import { NotificationPreferencesService } from "../../application/notification-preferences.service";
import { PrismaNotificationPreferencesRepository } from "../../adapters/driven/persistence/prisma-notification-preferences.repository";

const packageRoot = path.resolve(__dirname, "../../..");
const monorepoRoot = path.resolve(packageRoot, "../..");
loadEnv({ path: path.join(monorepoRoot, ".env") });

const notificationDatabaseUrl =
  process.env.NOTIFICATION_DATABASE_URL ??
  process.env.COMPLIANCE_DATABASE_URL ??
  "postgresql://lframework:lframework@localhost:5432/lframework";

describe("Notification preferences integration", () => {
  const prisma = new PrismaClient({
    datasources: { db: { url: notificationDatabaseUrl } },
  });
  const preferencesRepository = new PrismaNotificationPreferencesRepository(prisma);
  const preferencesService = new NotificationPreferencesService(preferencesRepository);
  const dispatchService = new NotificationDispatchService(preferencesService);
  const app = createApp(
    { routes: createNotificationRoutes(dispatchService, preferencesService) },
    { baseUrl: "http://localhost:3008" }
  );
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.notificationPreferenceModel.deleteMany();
      dbAvailable = true;
    } catch (err) {
      dbAvailable = false;
      const message = err instanceof Error ? err.message : String(err);
      console.warn("Notification integration: database unavailable. Run infra/migrations.", message);
    }
  });

  beforeEach(async () => {
    if (!dbAvailable) return;
    await prisma.notificationPreferenceModel.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("upserts preferences and retrieves by normalized recipient", async ({ skip }) => {
    if (!dbAvailable) skip();

    const recipientPath = "User@Example.com";
    const upsert = await request(app)
      .put(`/api/v1/notifications/preferences/${encodeURIComponent(recipientPath)}`)
      .send({
        channels: ["email", "webhook", "email"],
        frequency: "daily_digest",
        grouping: true,
        muteLowMedium: true,
      })
      .expect(200);

    expect(upsert.body).toMatchObject({
      recipient: "user@example.com",
      channels: ["email", "webhook"],
      frequency: "daily_digest",
      grouping: true,
      muteLowMedium: true,
    });

    const fetched = await request(app)
      .get("/api/v1/notifications/preferences/user@example.com")
      .expect(200);

    expect(fetched.body).toMatchObject({
      recipient: "user@example.com",
      channels: ["email", "webhook"],
      frequency: "daily_digest",
      grouping: true,
      muteLowMedium: true,
    });
    expect(typeof fetched.body.updatedAtUTC).toBe("string");
  });

  it("returns 404 when preference does not exist", async ({ skip }) => {
    if (!dbAvailable) skip();
    await request(app)
      .get("/api/v1/notifications/preferences/missing@example.com")
      .expect(404);
  });
});

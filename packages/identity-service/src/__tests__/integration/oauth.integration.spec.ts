import path from "path";
import { config as loadEnv } from "dotenv";
const packageRoot = path.resolve(__dirname, "../../..");
loadEnv({ path: path.join(packageRoot, ".env") });

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import type { ICacheService } from "@lframework/shared";
import { createContainer } from "../../container";
import { createApp } from "../../app";
import { createNoOpEventPublisher } from "./test-event-publisher";
import type { IOAuthProvider, OAuthUserInfo } from "../../application/ports/oauth-provider.port";
import { USER_ROLES, permissionsForRole } from "../../domain/types";

const databaseUrl =
  process.env.IDENTITY_DATABASE_URL ??
  "postgresql://lframework:lframework@localhost:5432/lframework_identity";

class InMemoryCache implements ICacheService {
  private readonly store = new Map<string, string>();

  async get<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as T | undefined) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

class FakeGoogleOAuthProvider implements IOAuthProvider {
  readonly provider = "google" as const;

  constructor(private readonly usersByCode: Record<string, OAuthUserInfo>) {}

  getAuthorizationUrl(redirectUri: string, state: string): string {
    return `https://oauth.example.test/google?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  }

  async getUserInfoFromCode(code: string): Promise<OAuthUserInfo | null> {
    return this.usersByCode[code] ?? null;
  }
}

describe("OAuth integration", () => {
  const cache = new InMemoryCache();
  const googleProvider = new FakeGoogleOAuthProvider({
    "new-user-code": {
      providerId: "google-new-user",
      email: "oauth-new@example.com",
      name: "OAuth New User",
    },
    "inactive-user-code": {
      providerId: "google-inactive-user",
      email: "inactive-oauth@example.com",
      name: "Inactive OAuth User",
    },
    "blocked-user-code": {
      providerId: "google-blocked-user",
      email: "blocked-oauth@example.com",
      name: "Blocked OAuth User",
    },
  });

  const container = createContainer({
    databaseUrl,
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    rabbitmqUrl: process.env.RABBITMQ_URL ?? "amqp://lframework:lframework@localhost:5672",
    jwtSecret: "oauth-integration-test-secret-min-32-chars",
    jwtExpiresInSeconds: 3600,
    baseUrl: "http://localhost:3001",
    googleProviderOverride: googleProvider,
    eventPublisherOverride: createNoOpEventPublisher(),
    cacheOverride: cache,
  });
  const app = createApp(container);

  let dbAvailable = false;
  let connected = false;

  async function getOAuthState(): Promise<string> {
    const res = await request(app).get("/api/auth/google").expect(302);
    const location = res.headers.location;
    expect(location).toBeTruthy();
    const state = new URL(location, "https://oauth.example.test").searchParams.get("state");
    expect(state).toBeTruthy();
    return state!;
  }

  beforeAll(async () => {
    try {
      await container.connectRabbitMQ();
      connected = true;
    } catch {
      connected = false;
    }

    try {
      await container.prisma.$connect();
      dbAvailable = true;
    } catch {
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    if (connected) {
      await container.disconnect();
      return;
    }

    await container.prisma.$disconnect();
  });

  beforeEach(async () => {
    cache.clear();
    if (!dbAvailable) return;
    await container.prisma.outboxModel.deleteMany({});
    await container.prisma.oAuthAccountModel.deleteMany({});
    await container.prisma.authCredentialModel.deleteMany({});
    await container.prisma.userModel.deleteMany({});
  });

  it("redirects to Google OAuth when provider is configured", async ({ skip }) => {
    if (!dbAvailable) skip();

    const res = await request(app).get("/api/auth/google").expect(302);

    expect(res.headers.location).toContain("https://oauth.example.test/google");
    expect(res.headers.location).toContain("state=");
  });

  it("authenticates with OAuth, creates user and writes audit log", async ({ skip }) => {
    if (!dbAvailable) skip();

    const state = await getOAuthState();

    const res = await request(app)
      .get("/api/auth/google/callback")
      .query({ code: "new-user-code", state })
      .expect(200);

    expect(res.body).toMatchObject({
      user: {
        email: "oauth-new@example.com",
        name: "OAuth New User",
        primaryRole: USER_ROLES.VISUALIZADOR,
        roles: [USER_ROLES.VISUALIZADOR],
        permissions: permissionsForRole(USER_ROLES.VISUALIZADOR),
        authzVersion: 1,
        isNewUser: true,
      },
      accessToken: expect.any(String),
    });

    const auditEvent = await container.prisma.outboxModel.findFirst({
      where: {
        eventName: "identity.auth.login_succeeded",
      },
      orderBy: { createdAt: "desc" },
    });

    expect(auditEvent).not.toBeNull();
    expect(auditEvent!.payload).toMatchObject({
      authMethod: "oauth",
      provider: "google",
      userId: res.body.user.id,
    });
  });

  it("rejects OAuth login for inactive user matched by email", async ({ skip }) => {
    if (!dbAvailable) skip();

    await request(app)
      .post("/api/auth/register")
      .send({
        email: "inactive-oauth@example.com",
        name: "Inactive OAuth User",
        password: "ValidPass123",
      })
      .expect(201);

    await container.prisma.userModel.updateMany({
      where: { email: "inactive-oauth@example.com" },
      data: { isActive: false },
    });

    const state = await getOAuthState();

    await request(app)
      .get("/api/auth/google/callback")
      .query({ code: "inactive-user-code", state })
      .expect(403);
  });

  it("rejects OAuth login for blocked linked user", async ({ skip }) => {
    if (!dbAvailable) skip();

    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        email: "blocked-oauth@example.com",
        name: "Blocked OAuth User",
        password: "ValidPass123",
      })
      .expect(201);

    await container.prisma.userModel.updateMany({
      where: { id: registerRes.body.user.id },
      data: {
        failedLoginAttempts: 5,
        blockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await container.prisma.oAuthAccountModel.create({
      data: {
        userId: registerRes.body.user.id,
        provider: "google",
        providerId: "google-blocked-user",
        createdAt: new Date(),
      },
    });

    const state = await getOAuthState();

    await request(app)
      .get("/api/auth/google/callback")
      .query({ code: "blocked-user-code", state })
      .expect(423);
  });
});

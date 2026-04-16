/**
 * Integration tests for Compliance API (GET/POST/PATCH /api/violations, health).
 * Require PostgreSQL. Redis and RabbitMQ are not required (tests use no-op adapters).
 */
import path from "path";
import { config as loadEnv } from "dotenv";
import { createServer } from "node:net";
const packageRoot = path.resolve(__dirname, "../../..");
loadEnv({ path: path.join(packageRoot, ".env") });

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createContainer } from "../../container";
import { createApp } from "../../app";
import { createNoOpCache } from "./test-cache";
import { createNoOpEventConsumer } from "./test-event-consumer";

const databaseUrl =
  process.env.COMPLIANCE_DATABASE_URL ??
  "postgresql://lframework:lframework@localhost:5432/lframework";
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const rabbitmqUrl =
  process.env.RABBITMQ_URL ?? "amqp://lframework:lframework@localhost:5672";
const jwtSecret =
  process.env.JWT_SECRET ?? "integration-test-secret-min-32-chars-for-jwt";

describe("Compliance API integration", () => {
  const config = {
    databaseUrl,
    redisUrl,
    rabbitmqUrl,
    jwtSecret: jwtSecret.length >= 32 ? jwtSecret : "integration-test-secret-min-32-chars-for-jwt",
    cacheOverride: createNoOpCache(),
    eventConsumerOverride: createNoOpEventConsumer(),
  };

  const container = createContainer(config);
  const app = createApp(container, { baseUrl: "http://localhost:3002" });

  let dbAvailable = false;
  let canListen = true;

  beforeAll(async () => {
    canListen = await canBindTcpPort();
    try {
      await container.connectRabbitMQ(async () => {});
    } catch {
      // noop (event consumer is overridden)
    }

    try {
      await container.prisma.$connect();
      await container.prisma.$executeRawUnsafe(`DELETE FROM "items"`);
      dbAvailable = true;
    } catch {
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    await container.disconnect();
  });

  beforeEach(async () => {
    if (!dbAvailable) return;
    await container.prisma.$executeRawUnsafe(`DELETE FROM "items"`);
  });

  function validToken(
    permissions: string[] = [
      "compliance.violations.read",
      "compliance.violations.create",
      "compliance.test.access",
    ]
  ): string {
    return jwt.sign(
      {
        sub: "test-user-id",
        primaryRole: "gestor",
        roles: ["gestor"],
        permissions,
        authzVersion: 1,
      },
      config.jwtSecret,
      { algorithm: "HS256" }
    );
  }

  describe("GET /api/violations", () => {
    it("returns 401 when Authorization header is missing", async ({ skip }) => {
      if (!dbAvailable) skip();
      await request(app).get("/api/violations").expect(401);
    });

    it("returns 403 when token lacks compliance.violations.read", async ({ skip }) => {
      if (!dbAvailable) skip();
      await request(app)
        .get("/api/violations")
        .set("Authorization", `Bearer ${validToken(["compliance.violations.create"])}`)
        .expect(403);
    });

    it("returns 200 with empty array when no violations exist", async ({ skip }) => {
      if (!dbAvailable) skip();
      const res = await request(app)
        .get("/api/violations")
        .set("Authorization", `Bearer ${validToken(["compliance.violations.read"])}`)
        .expect(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("POST /api/violations", () => {
    it("returns 401 when Authorization header is missing", async ({ skip }) => {
      if (!dbAvailable) skip();
      await request(app)
        .post("/api/violations")
        .send({ title: "Sem token", severity: "media" })
        .expect(401);
    });

    it("returns 403 when token lacks compliance.violations.create", async ({ skip }) => {
      if (!dbAvailable) skip();
      await request(app)
        .post("/api/violations")
        .set("Authorization", `Bearer ${validToken(["compliance.violations.read"])}`)
        .send({ title: "Sem permissão", severity: "baixa" })
        .expect(403);
    });

    it("returns 201 with created violation when payload is valid", async ({ skip }) => {
      if (!dbAvailable) skip();
      const res = await request(app)
        .post("/api/violations")
        .set("Authorization", `Bearer ${validToken(["compliance.violations.create"])}`)
        .send({ title: "Política sem evidência", severity: "alta" })
        .expect(201);

      expect(res.body).toMatchObject({
        title: "Política sem evidência",
        severity: "alta",
        status: "aberta",
      });
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("createdAt");
    });

    it("returns 400 when payload is invalid", async ({ skip }) => {
      if (!dbAvailable) skip();
      await request(app)
        .post("/api/violations")
        .set("Authorization", `Bearer ${validToken(["compliance.violations.create"])}`)
        .send({ title: "x", severity: "critica" })
        .expect(400);
    });
  });

  describe("PATCH /api/violations/:violationId", () => {
    it("returns 404 when violation does not exist", async ({ skip }) => {
      if (!dbAvailable) skip();
      await request(app)
        .patch("/api/violations/unknown-id")
        .set("Authorization", `Bearer ${validToken(["compliance.violations.create"])}`)
        .send({ title: "Novo título", severity: "baixa" })
        .expect(404);
    });

    it("returns 200 with updated violation when payload is valid", async ({ skip }) => {
      if (!dbAvailable) skip();

      const created = await request(app)
        .post("/api/violations")
        .set("Authorization", `Bearer ${validToken(["compliance.violations.create"])}`)
        .send({ title: "Regra inicial", severity: "baixa" })
        .expect(201);

      const updated = await request(app)
        .patch(`/api/violations/${created.body.id}`)
        .set("Authorization", `Bearer ${validToken(["compliance.violations.create"])}`)
        .send({ title: "Regra atualizada", severity: "alta" })
        .expect(200);

      expect(updated.body).toMatchObject({
        id: created.body.id,
        title: "Regra atualizada",
        severity: "alta",
        status: "aberta",
      });
    });
  });

  describe("GET /api/violations/test-permission", () => {
    it("returns 200 when token has compliance.test.access", async ({ skip }) => {
      if (!dbAvailable) skip();
      const res = await request(app)
        .get("/api/violations/test-permission")
        .set("Authorization", `Bearer ${validToken(["compliance.test.access"])}`)
        .expect(200);
      expect(res.body).toEqual({ ok: true, permission: "compliance.test.access" });
    });
  });

  describe("GET /health", () => {
    it("returns 200 with service name and status ok", async ({ skip }) => {
      if (!canListen) skip();
      const res = await request(app).get("/health").expect(200);
      expect(res.body).toMatchObject({
        status: "ok",
        service: "compliance-service",
      });
    });
  });
});

async function canBindTcpPort(): Promise<boolean> {
  return await new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(0, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

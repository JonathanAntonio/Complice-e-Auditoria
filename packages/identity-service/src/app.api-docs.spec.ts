import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { Router } from "express";
import { createServer } from "node:net";
import { createApp } from "./app";

describe("Identity API docs routes", () => {
  let canListen = true;

  beforeAll(async () => {
    canListen = await canBindTcpPort();
  });

  it("serves OpenAPI spec at GET /api-docs.json when baseUrl is provided", async ({ skip }) => {
    if (!canListen) skip();
    const app = createApp(
      {
        userRoutes: Router(),
        authRoutes: Router(),
        mapApplicationErrorToHttp: () => null,
      },
      { baseUrl: "http://localhost:3001" }
    );

    const res = await request(app).get("/api-docs.json").expect(200);
    expect(res.body).toMatchObject({
      openapi: expect.any(String),
      info: expect.any(Object),
      paths: expect.any(Object),
    });
    expect(res.body.paths).toHaveProperty("/api/auth/google/url");
    expect(res.body.paths).toHaveProperty("/api/auth/github/url");
    expect(res.body.paths).toHaveProperty("/api/users");
  });

  it("serves Swagger UI at GET /api-docs", async ({ skip }) => {
    if (!canListen) skip();
    const app = createApp(
      {
        userRoutes: Router(),
        authRoutes: Router(),
        mapApplicationErrorToHttp: () => null,
      },
      { baseUrl: "http://localhost:3001" }
    );

    const res = await request(app).get("/api-docs").redirects(1).expect(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text).toContain("Identity Service API");
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

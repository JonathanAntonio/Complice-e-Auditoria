import { describe, it, expect } from "vitest";
import request from "supertest";
import { Router } from "express";
import { createApp } from "./app";

describe("Catalog API docs routes", () => {
  it("serves OpenAPI spec at GET /api-docs.json when baseUrl is provided", async () => {
    const app = createApp(
      {
        itemRoutes: Router(),
        mapApplicationErrorToHttp: () => null,
      },
      { baseUrl: "http://localhost:3002" }
    );

    const res = await request(app).get("/api-docs.json").expect(200);
    expect(res.body).toMatchObject({
      openapi: expect.any(String),
      info: expect.any(Object),
      paths: expect.any(Object),
    });
    expect(res.body.paths).toHaveProperty("/api/items");
    expect(res.body.paths).toHaveProperty("/api/items/test-permission");
  });

  it("serves Swagger UI at GET /api-docs", async () => {
    const app = createApp(
      {
        itemRoutes: Router(),
        mapApplicationErrorToHttp: () => null,
      },
      { baseUrl: "http://localhost:3002" }
    );

    const res = await request(app).get("/api-docs").redirects(1).expect(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text).toContain("Catalog Service API");
  });
});


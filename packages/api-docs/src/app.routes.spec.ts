import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app";

type MinimalFetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

describe("api-docs routes", () => {
  it("returns merged OpenAPI spec at GET /openapi.json", async () => {
    const fakeFetch = async (url: string): Promise<MinimalFetchResponse> => {
      const identitySpec = {
        openapi: "3.0.0",
        info: { title: "Identity", version: "1.0.0" },
        servers: [{ url: "http://localhost:3001" }],
        paths: { "/api/auth/google/url": { get: { responses: { "200": { description: "OK" } } } } },
      };
      const catalogSpec = {
        openapi: "3.0.0",
        info: { title: "Catalog", version: "1.0.0" },
        servers: [{ url: "http://localhost:3002" }],
        paths: { "/api/items": { get: { responses: { "200": { description: "OK" } } } } },
      };
      const integrationSpec = {
        openapi: "3.0.0",
        info: { title: "Integration", version: "1.0.0" },
        servers: [{ url: "http://localhost:3003" }],
        paths: { "/api/integrations/events": { post: { responses: { "202": { description: "Accepted" } } } } },
      };

      const body = url.includes("identity")
        ? identitySpec
        : url.includes("catalog")
          ? catalogSpec
          : integrationSpec;
      return { ok: true, status: 200, json: async () => body };
    };

    const app = createApp({
      identitySpecUrl: "http://identity.test/api-docs.json",
      catalogSpecUrl: "http://catalog.test/api-docs.json",
      integrationSpecUrl: "http://integration.test/api-docs.json",
      fetchFn: fakeFetch as unknown as typeof fetch,
    });

    const res = await request(app).get("/openapi.json").expect(200);
    expect(res.headers["x-served-by"]).toBe("api-docs");
    expect(res.body).toMatchObject({
      openapi: "3.0.3",
      info: { title: "LFramework API" },
      paths: expect.any(Object),
    });
    expect(res.body.paths).toHaveProperty("/api/auth/google/url");
    expect(res.body.paths).toHaveProperty("/api/items");
    expect(res.body.paths).toHaveProperty("/api/integrations/events");
  });

  it("returns 502 with hint when upstream specs are unavailable", async () => {
    const failingFetch = async (): Promise<MinimalFetchResponse> => {
      return { ok: false, status: 503, json: async () => ({}) };
    };

    const app = createApp({
      identitySpecUrl: "http://identity.test/api-docs.json",
      catalogSpecUrl: "http://catalog.test/api-docs.json",
      integrationSpecUrl: "http://integration.test/api-docs.json",
      fetchFn: failingFetch as unknown as typeof fetch,
    });

    const res = await request(app).get("/openapi.json").expect(502);
    expect(res.body).toMatchObject({
      error: "Failed to merge specs",
      message: expect.any(String),
      hint: expect.any(String),
    });
  });

  it("serves Swagger UI at GET /", async () => {
    const app = createApp({
      identitySpecUrl: "http://identity.test/api-docs.json",
      catalogSpecUrl: "http://catalog.test/api-docs.json",
      integrationSpecUrl: "http://integration.test/api-docs.json",
      fetchFn: (async () => ({ ok: true, status: 200, json: async () => ({}) })) as unknown as typeof fetch,
    });

    const res = await request(app).get("/").expect(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text).toContain("LFramework API");
    expect(res.text).toContain("swagger-ui-bundle.js");
    expect(res.text).toContain("swagger-ui-init.js");
  });
});

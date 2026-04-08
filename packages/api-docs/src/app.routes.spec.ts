import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createServer } from "node:net";
import { createApp } from "./app";

type MinimalFetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

describe("api-docs routes", () => {
  let canListen = true;

  beforeAll(async () => {
    canListen = await canBindTcpPort();
  });

  it("returns merged OpenAPI spec at GET /openapi.json", async ({ skip }) => {
    if (!canListen) skip();
    const fakeFetch = async (url: string): Promise<MinimalFetchResponse> => {
      const identitySpec = {
        openapi: "3.0.0",
        info: { title: "Identity", version: "1.0.0" },
        servers: [{ url: "http://localhost:3001" }],
        paths: { "/api/auth/google/url": { get: { responses: { "200": { description: "OK" } } } } },
      };
      const complianceSpec = {
        openapi: "3.0.0",
        info: { title: "Compliance", version: "1.0.0" },
        servers: [{ url: "http://localhost:3002" }],
        paths: { "/api/violations": { get: { responses: { "200": { description: "OK" } } } } },
      };
      const integrationSpec = {
        openapi: "3.0.0",
        info: { title: "Integration", version: "1.0.0" },
        servers: [{ url: "http://localhost:3003" }],
        paths: { "/api/integrations/events": { post: { responses: { "202": { description: "Accepted" } } } } },
      };
      const auditSpec = {
        openapi: "3.0.0",
        info: { title: "Audit", version: "1.0.0" },
        servers: [{ url: "http://localhost:3005" }],
        paths: { "/api/audit/logs": { get: { responses: { "200": { description: "OK" } } } } },
      };

      const body = url.includes("identity")
        ? identitySpec
        : url.includes("compliance")
          ? complianceSpec
          : url.includes("integration")
            ? integrationSpec
            : auditSpec;
      return { ok: true, status: 200, json: async () => body };
    };

    const app = createApp({
      identitySpecUrl: "http://identity.test/api-docs.json",
      complianceSpecUrl: "http://compliance.test/api-docs.json",
      integrationSpecUrl: "http://integration.test/api-docs.json",
      auditSpecUrl: "http://audit.test/api-docs.json",
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
    expect(res.body.paths).toHaveProperty("/api/violations");
    expect(res.body.paths).toHaveProperty("/api/integrations/events");
    expect(res.body.paths).toHaveProperty("/api/audit/logs");
  });

  it("returns 502 with hint when upstream specs are unavailable", async ({ skip }) => {
    if (!canListen) skip();
    const failingFetch = async (): Promise<MinimalFetchResponse> => {
      return { ok: false, status: 503, json: async () => ({}) };
    };

    const app = createApp({
      identitySpecUrl: "http://identity.test/api-docs.json",
      complianceSpecUrl: "http://compliance.test/api-docs.json",
      integrationSpecUrl: "http://integration.test/api-docs.json",
      auditSpecUrl: "http://audit.test/api-docs.json",
      fetchFn: failingFetch as unknown as typeof fetch,
    });

    const res = await request(app).get("/openapi.json").expect(502);
    expect(res.body).toMatchObject({
      error: "Failed to merge specs",
      message: expect.any(String),
      hint: expect.any(String),
    });
  });

  it("serves Swagger UI at GET /", async ({ skip }) => {
    if (!canListen) skip();
    const app = createApp({
      identitySpecUrl: "http://identity.test/api-docs.json",
      complianceSpecUrl: "http://compliance.test/api-docs.json",
      integrationSpecUrl: "http://integration.test/api-docs.json",
      auditSpecUrl: "http://audit.test/api-docs.json",
      fetchFn: (async () => ({ ok: true, status: 200, json: async () => ({}) })) as unknown as typeof fetch,
    });

    const res = await request(app).get("/").expect(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text).toContain("LFramework API");
    expect(res.text).toContain("swagger-ui-bundle.js");
    expect(res.text).toContain("swagger-ui-init.js");
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

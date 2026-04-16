import { afterEach, describe, expect, it, vi } from "vitest";
import { ComplianceHttpClient } from "./compliance-http.client";
import { UpstreamHttpError } from "../../../application/errors/upstream-http.error";

describe("ComplianceHttpClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists compliance violations", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([{ id: "v-1", title: "Acesso indevido", severity: "alta", status: "aberta", createdAt: "2026-01-01T00:00:00.000Z" }]),
        { status: 200 }
      )
    );

    const client = new ComplianceHttpClient({
      gatewayBaseUrl: "https://gateway.example.com",
      complianceBasePath: "/compliance/api",
    });

    const violations = await client.listViolations("token");

    expect(violations).toEqual([
      {
        id: "v-1",
        title: "Acesso indevido",
        severity: "alta",
        status: "aberta",
        resolvedAt: null,
        dismissedAt: null,
        retentionUntil: null,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("throws UpstreamHttpError on create when response is non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "forbidden" }), { status: 403 })
    );

    const client = new ComplianceHttpClient({
      gatewayBaseUrl: "https://gateway.example.com",
      complianceBasePath: "/compliance/api",
    });

    await expect(
      client.createViolation("token", { title: "Acesso indevido", severity: "alta" })
    ).rejects.toBeInstanceOf(UpstreamHttpError);
  });

  it("updates compliance violation", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ id: "v-1", title: "Título atualizado", severity: "media", status: "aberta", createdAt: "2026-01-01T00:00:00.000Z" }),
        { status: 200 }
      )
    );

    const client = new ComplianceHttpClient({
      gatewayBaseUrl: "https://gateway.example.com",
      complianceBasePath: "/compliance/api",
    });

    const updated = await client.updateViolation("token", "v-1", { title: "Título atualizado", severity: "media" });

    expect(updated).toEqual({
      id: "v-1",
      title: "Título atualizado",
      severity: "media",
      status: "aberta",
      resolvedAt: null,
      dismissedAt: null,
      retentionUntil: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});

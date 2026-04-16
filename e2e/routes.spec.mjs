import { test, expect } from "@playwright/test";

async function isUp(request, path) {
  try {
    const res = await request.get(path);
    return res.ok();
  } catch {
    return false;
  }
}

test.describe("Gateway route smoke tests (Playwright)", () => {
  test("GET /health (gateway)", async ({ request }, testInfo) => {
    const up = await isUp(request, "/health");
    test.skip(!up, `Gateway indisponível em ${testInfo.project.use.baseURL}. Suba docker + serviços antes de rodar o e2e.`);

    const res = await request.get("/health");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/json");
    expect(await res.json()).toMatchObject({ status: "ok", service: "api-gateway" });
  });

  test("GET /identity/health (proxied)", async ({ request }, testInfo) => {
    const up = await isUp(request, "/identity/health");
    test.skip(!up, `Identity indisponível em ${testInfo.project.use.baseURL}.`);

    const res = await request.get("/identity/health");
    expect(res.status()).toBe(200);
    expect(res.headers()["x-gateway"]).toBe("nginx");
    const body = await res.json();
    expect(body).toHaveProperty("status");
  });

  test("GET /compliance/health (proxied)", async ({ request }, testInfo) => {
    const up = await isUp(request, "/compliance/health");
    test.skip(!up, `Compliance indisponível em ${testInfo.project.use.baseURL}.`);

    const res = await request.get("/compliance/health");
    expect(res.status()).toBe(200);
    expect(res.headers()["x-gateway"]).toBe("nginx");
    const body = await res.json();
    expect(body).toHaveProperty("status");
  });

  test("Docs unificado: GET /api-docs/ e /api-docs/openapi.json", async ({ page, request }, testInfo) => {
    const up = await isUp(request, "/api-docs/");
    test.skip(!up, `api-docs indisponível em ${testInfo.project.use.baseURL}.`);

    const uiRes = await request.get("/api-docs/");
    expect(uiRes.status()).toBe(200);
    expect(uiRes.headers()["x-gateway"]).toBe("nginx");
    expect(uiRes.headers()["content-type"]).toContain("text/html");

    await page.goto("/api-docs/");
    await expect(page).toHaveTitle(/LFramework API/i);

    const specRes = await request.get("/api-docs/openapi.json");
    expect(specRes.status()).toBe(200);
    expect(specRes.headers()["content-type"]).toContain("application/json");
    const spec = await specRes.json();
    expect(spec).toMatchObject({ openapi: expect.any(String), info: expect.any(Object), paths: expect.any(Object) });
  });

  test("Identity: rotas autenticadas existem (401/400 esperados)", async ({ request }, testInfo) => {
    const up = await isUp(request, "/identity/health");
    test.skip(!up, `Identity indisponível em ${testInfo.project.use.baseURL}.`);

    await request.get("/identity/api/auth/me").then((r) => expect(r.status()).toBe(401));
    await request.get("/identity/api/users/00000000-0000-0000-0000-000000000000").then((r) => expect(r.status()).toBe(401));

    // validação de payload (não depende de DB): body vazio deve falhar antes do use case
    const registerRes = await request.post("/identity/api/auth/register", { data: {} });
    expect(registerRes.status()).toBe(400);
  });

  test("Compliance: rotas autenticadas existem (401 esperado)", async ({ request }, testInfo) => {
    const up = await isUp(request, "/compliance/health");
    test.skip(!up, `Compliance indisponível em ${testInfo.project.use.baseURL}.`);

    await request.get("/compliance/api/violations").then((r) => expect(r.status()).toBe(401));
    await request.get("/compliance/api/violations/test-permission").then((r) => expect(r.status()).toBe(401));
    await request.post("/compliance/api/violations", { data: {} }).then((r) => expect(r.status()).toBe(401));
  });
});

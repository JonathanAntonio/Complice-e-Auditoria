import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { createRequire } from "module";

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!key) continue;
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv(path.resolve(process.cwd(), ".env"));

const require = createRequire(import.meta.url);
const { PrismaClient: IdentityPrismaClient } = require("../packages/identity-service/generated/prisma-client");
const argon2 = require("argon2");

// Use compiled JS to avoid TS imports in Playwright.
const {
  ensureAuthorizationCatalog,
  resolveRoleIdByCode,
} = require("../packages/identity-service/dist/adapters/driven/persistence/authorization-catalog.js");
const { USER_ROLES } = require("../packages/identity-service/dist/domain/types.js");

async function isUp(request, pathName) {
  try {
    const res = await request.get(pathName);
    return res.ok();
  } catch {
    return false;
  }
}

async function ensureAdminSeeded() {
  const databaseUrl = process.env.IDENTITY_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("IDENTITY_DATABASE_URL não está definido no ambiente.");
  }

  const prisma = new IdentityPrismaClient({ datasources: { db: { url: databaseUrl } } });
  await prisma.$connect();
  try {
    await ensureAuthorizationCatalog(prisma);

    const adminRoleId = await resolveRoleIdByCode(prisma, USER_ROLES.ADMINISTRADOR);

    const email = process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@local.test";
    const password = process.env.E2E_ADMIN_PASSWORD ?? "E2EAdminPass123!";
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const user = await prisma.userModel.upsert({
      where: { email },
      update: { name: "E2E Admin", isActive: true, failedLoginAttempts: 0, blockedUntil: null },
      create: { id: randomUUID(), email, name: "E2E Admin" },
    });

    await prisma.authCredentialModel.upsert({
      where: { userId: user.id },
      update: { passwordHash },
      create: { userId: user.id, passwordHash },
    });

    await prisma.userRoleModel.updateMany({ where: { userId: user.id }, data: { isPrimary: false } });
    await prisma.userRoleModel.deleteMany({ where: { userId: user.id, roleId: { not: adminRoleId } } });

    await prisma.userRoleModel.upsert({
      where: { userId_roleId: { userId: user.id, roleId: adminRoleId } },
      update: { isPrimary: true },
      create: { userId: user.id, roleId: adminRoleId, isPrimary: true, assignedBy: "e2e-playwright" },
    });

    return { email, password };
  } finally {
    await prisma.$disconnect();
  }
}

test.describe("Gateway real-usage E2E (Playwright)", () => {
  test("exercita rotas via gateway com login real (DB + permissões)", async ({ request, page }, testInfo) => {
    const gatewayUp = await isUp(request, "/health");
    test.skip(!gatewayUp, `Gateway indisponível em ${testInfo.project.use.baseURL}. Suba docker + serviços antes de rodar.`);

    const identityUp = await isUp(request, "/identity/health");
    const catalogUp = await isUp(request, "/catalog/health");
    test.skip(!identityUp || !catalogUp, "Identity ou Catalog indisponível (precisa dos serviços rodando).");

    // Seed admin (real permissions)
    const { email: adminEmail, password: adminPassword } = await ensureAdminSeeded();

    // Unified docs should be reachable
    await page.goto("/api-docs/");
    await expect(page).toHaveTitle(/LFramework API/i);
    const openapiRes = await request.get("/api-docs/openapi.json");
    expect(openapiRes.status()).toBe(200);

    // Register + login as normal user
    const runId = randomUUID();
    const userEmail = `e2e-user-${runId}@local.test`;
    const userPassword = "UserPass123!";

    const registerRes = await request.post("/identity/api/auth/register", {
      data: { email: userEmail, name: "E2E User", password: userPassword },
    });
    expect(registerRes.status()).toBe(201);
    const registerBody = await registerRes.json();
    expect(registerBody).toHaveProperty("accessToken");

    const loginRes = await request.post("/identity/api/auth/login", {
      data: { email: userEmail, password: userPassword },
    });
    expect(loginRes.status()).toBe(200);
    const loginBody = await loginRes.json();
    const userToken = loginBody.accessToken;

    // /auth/me
    const meRes = await request.get("/identity/api/auth/me", {
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(meRes.status()).toBe(200);

    // Catalog: normal user can read, cannot create/test
    const itemsRes = await request.get("/catalog/api/items", {
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(itemsRes.status()).toBe(200);

    const forbiddenCreateRes = await request.post("/catalog/api/items", {
      headers: { authorization: `Bearer ${userToken}` },
      data: { name: `Item ${runId}`, priceAmount: 1234, priceCurrency: "BRL" },
    });
    expect(forbiddenCreateRes.status()).toBe(403);

    const forbiddenTestRes = await request.get("/catalog/api/items/test-permission", {
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(forbiddenTestRes.status()).toBe(403);

    // Admin login
    const adminLoginRes = await request.post("/identity/api/auth/login", {
      data: { email: adminEmail, password: adminPassword },
    });
    expect(adminLoginRes.status()).toBe(200);
    const adminToken = (await adminLoginRes.json()).accessToken;

    // Admin-only Identity routes
    const createUserRes = await request.post("/identity/api/users", {
      headers: { authorization: `Bearer ${adminToken}` },
      data: { email: `e2e-created-${runId}@local.test`, name: "Created By Admin" },
    });
    expect(createUserRes.status()).toBe(201);
    const createdUser = await createUserRes.json();
    expect(createdUser).toHaveProperty("id");

    const getUserRes = await request.get(`/identity/api/users/${createdUser.id}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(getUserRes.status()).toBe(200);

    const setPrimaryRoleRes = await request.put(`/identity/api/users/${createdUser.id}/role`, {
      headers: { authorization: `Bearer ${adminToken}` },
      data: { primaryRole: "gestor" },
    });
    expect(setPrimaryRoleRes.status()).toBe(200);

    const setRolesRes = await request.put(`/identity/api/users/${createdUser.id}/roles`, {
      headers: { authorization: `Bearer ${adminToken}` },
      data: { primaryRole: "gestor", roles: ["gestor", "visualizador"] },
    });
    expect(setRolesRes.status()).toBe(200);

    // Catalog: admin can create + access test route
    const adminCreateItemRes = await request.post("/catalog/api/items", {
      headers: { authorization: `Bearer ${adminToken}` },
      data: { name: `Admin Item ${runId}`, priceAmount: 555, priceCurrency: "BRL" },
    });
    expect(adminCreateItemRes.status()).toBe(201);

    const adminTestRes = await request.get("/catalog/api/items/test-permission", {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(adminTestRes.status()).toBe(200);
  });
});

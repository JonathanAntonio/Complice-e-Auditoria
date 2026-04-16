import { randomUUID } from "crypto";
import type { PrismaClient } from "../../../../generated/prisma-client";
import {
  PERMISSIONS,
  USER_ROLES,
  permissionsForRole,
  type Permission,
  type UserRole,
} from "../../../domain/types";

type AuthorizationDb = Pick<PrismaClient, "$executeRaw" | "$queryRaw">;
let authorizationRegistrySeeded = false;
let authorizationRegistrySeedingPromise: Promise<void> | null = null;

class RoleNotFoundError extends Error {
  constructor(role: UserRole) {
    super(`Role not found: ${role}`);
    this.name = "RoleNotFoundError";
  }
}

const ROLE_NAMES: Record<UserRole, string> = {
  [USER_ROLES.ADMINISTRADOR]: "Administrador",
  [USER_ROLES.COMPLIANCE_OFFICER]: "Compliance Officer",
  [USER_ROLES.AUDITOR_INTERNO]: "Auditor Interno",
  [USER_ROLES.AUDITOR_EXTERNO]: "Auditor Externo",
  [USER_ROLES.GESTOR]: "Gestor",
  [USER_ROLES.VISUALIZADOR]: "Visualizador",
};

const PERMISSION_NAMES: Record<Permission, string> = {
  [PERMISSIONS.USERS_CREATE]: "Criar usuários",
  [PERMISSIONS.USERS_READ_SELF]: "Ler o próprio usuário",
  [PERMISSIONS.USERS_READ_ANY]: "Ler qualquer usuário",
  [PERMISSIONS.USERS_UPDATE]: "Atualizar usuários",
  [PERMISSIONS.USERS_DEACTIVATE]: "Desativar usuários",
  [PERMISSIONS.ROLES_ASSIGN]: "Atribuir papéis",
  [PERMISSIONS.ROLES_READ]: "Consultar papéis",
  [PERMISSIONS.AUDIT_LOGS_READ_ANY]: "Ler logs de auditoria",
  [PERMISSIONS.AUDIT_LOGS_READ_SCOPED]: "Ler logs de auditoria do escopo",
  [PERMISSIONS.COMPLIANCE_RULES_CREATE]: "Criar regras de compliance",
  [PERMISSIONS.COMPLIANCE_RULES_UPDATE]: "Atualizar regras de compliance",
  [PERMISSIONS.COMPLIANCE_RULES_DEACTIVATE]: "Desativar regras de compliance",
  [PERMISSIONS.DASHBOARD_READ]: "Ler dashboard",
  [PERMISSIONS.RISK_SCORES_READ]: "Ler pontuações de risco",
  [PERMISSIONS.REPORTS_READ]: "Ler relatórios",
  [PERMISSIONS.REPORTS_EXPORT]: "Exportar relatórios",
  [PERMISSIONS.INTEGRATIONS_READ]: "Ler integrações",
  [PERMISSIONS.INTEGRATIONS_MANAGE]: "Gerenciar integrações",
  [PERMISSIONS.SYSTEM_SETTINGS_MANAGE]: "Gerenciar configurações do sistema",
  [PERMISSIONS.COMPLIANCE_VIOLATIONS_READ]: "Ler violações de compliance",
  [PERMISSIONS.COMPLIANCE_VIOLATIONS_CREATE]: "Criar violações de compliance",
  [PERMISSIONS.COMPLIANCE_TEST_ACCESS]: "Acessar rota de teste de compliance",
};

const LEGACY_PERMISSION_CODE_MAP: Record<string, Permission> = {
  "catalog.items.read": PERMISSIONS.COMPLIANCE_VIOLATIONS_READ,
  "catalog.items.create": PERMISSIONS.COMPLIANCE_VIOLATIONS_CREATE,
  "catalog.test.access": PERMISSIONS.COMPLIANCE_TEST_ACCESS,
};

function moduleForPermission(permission: Permission): string {
  return permission.split(".")[0] ?? "general";
}

export async function ensureAuthorizationRegistry(db: AuthorizationDb): Promise<void> {
  await migrateLegacyPermissionCodes(db);

  for (const role of Object.values(USER_ROLES)) {
    await db.$executeRaw`
      INSERT INTO "roles" ("id", "code", "name", "is_system", "created_at", "updated_at")
      VALUES (${randomUUID()}, ${role}, ${ROLE_NAMES[role]}, true, NOW(), NOW())
      ON CONFLICT ("code") DO UPDATE SET
        "name" = EXCLUDED."name",
        "updated_at" = NOW()
    `;
  }

  for (const permission of Object.values(PERMISSIONS)) {
    await db.$executeRaw`
      INSERT INTO "permissions" ("id", "code", "name", "module", "created_at", "updated_at")
      VALUES (
        ${randomUUID()},
        ${permission},
        ${PERMISSION_NAMES[permission]},
        ${moduleForPermission(permission)},
        NOW(),
        NOW()
      )
      ON CONFLICT ("code") DO UPDATE SET
        "name" = EXCLUDED."name",
        "module" = EXCLUDED."module",
        "updated_at" = NOW()
    `;
  }

  for (const role of Object.values(USER_ROLES)) {
    const roleRow = await resolveRoleRowByCode(db, role);
    for (const permission of permissionsForRole(role)) {
      const permissionRow = await resolvePermissionRowByCode(db, permission);
      await db.$executeRaw`
        INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
        VALUES (${roleRow.id}, ${permissionRow.id}, NOW())
        ON CONFLICT ("role_id", "permission_id") DO NOTHING
      `;
    }
  }
}

async function migrateLegacyPermissionCodes(db: AuthorizationDb): Promise<void> {
  for (const [legacyCode, currentCode] of Object.entries(LEGACY_PERMISSION_CODE_MAP)) {
    await db.$executeRaw`
      UPDATE "role_permissions" rp
      SET "permission_id" = p_current."id"
      FROM "permissions" p_legacy
      JOIN "permissions" p_current ON p_current."code" = ${currentCode}
      WHERE p_legacy."code" = ${legacyCode}
        AND rp."permission_id" = p_legacy."id"
        AND NOT EXISTS (
          SELECT 1
          FROM "role_permissions" rp2
          WHERE rp2."role_id" = rp."role_id"
            AND rp2."permission_id" = p_current."id"
        )
    `;

    await db.$executeRaw`
      DELETE FROM "role_permissions" rp
      USING "permissions" p_legacy, "permissions" p_current
      WHERE p_legacy."code" = ${legacyCode}
        AND p_current."code" = ${currentCode}
        AND rp."permission_id" = p_legacy."id"
        AND EXISTS (
          SELECT 1
          FROM "role_permissions" rp2
          WHERE rp2."role_id" = rp."role_id"
            AND rp2."permission_id" = p_current."id"
        )
    `;

    await db.$executeRaw`
      DELETE FROM "permissions" p_legacy
      USING "permissions" p_current
      WHERE p_legacy."code" = ${legacyCode}
        AND p_current."code" = ${currentCode}
    `;

    await db.$executeRaw`
      UPDATE "permissions"
      SET "code" = ${currentCode}, "updated_at" = NOW()
      WHERE "code" = ${legacyCode}
    `;
  }
}

async function ensureAuthorizationRegistryInitialized(db: AuthorizationDb): Promise<void> {
  if (authorizationRegistrySeeded) {
    return;
  }

  if (!authorizationRegistrySeedingPromise) {
    authorizationRegistrySeedingPromise = (async () => {
      await ensureAuthorizationRegistry(db);
      authorizationRegistrySeeded = true;
    })().finally(() => {
      authorizationRegistrySeedingPromise = null;
    });
  }

  await authorizationRegistrySeedingPromise;
}

export async function resolveRoleIdByCode(db: AuthorizationDb, role: UserRole): Promise<string> {
  await ensureAuthorizationRegistryInitialized(db);

  try {
    return (await resolveRoleRowByCode(db, role)).id;
  } catch (err) {
    if (!(err instanceof RoleNotFoundError)) {
      throw err;
    }

    authorizationRegistrySeeded = false;
    await ensureAuthorizationRegistryInitialized(db);
    return (await resolveRoleRowByCode(db, role)).id;
  }
}

async function resolveRoleRowByCode(db: AuthorizationDb, role: UserRole): Promise<{ id: string }> {
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "roles" WHERE "code" = ${role} LIMIT 1
  `;
  const row = rows[0];
  if (!row) {
    throw new RoleNotFoundError(role);
  }
  return row;
}

async function resolvePermissionRowByCode(
  db: AuthorizationDb,
  permission: Permission
): Promise<{ id: string }> {
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "permissions" WHERE "code" = ${permission} LIMIT 1
  `;
  const row = rows[0];
  if (!row) {
    throw new Error(`Permission not found: ${permission}`);
  }
  return row;
}

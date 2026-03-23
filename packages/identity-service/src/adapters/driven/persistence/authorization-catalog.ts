import { randomUUID } from "crypto";
import type { PrismaClient } from "../../../../generated/prisma-client";
import {
  PERMISSIONS,
  USER_ROLES,
  permissionsForRole,
  type Permission,
  type UserRole,
} from "../../../domain/types";

type CatalogDb = Pick<PrismaClient, "$executeRaw" | "$queryRaw">;
let authorizationCatalogSeeded = false;
let authorizationCatalogSeedingPromise: Promise<void> | null = null;

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
  [PERMISSIONS.REPORTS_READ]: "Ler relatórios",
  [PERMISSIONS.REPORTS_EXPORT]: "Exportar relatórios",
  [PERMISSIONS.INTEGRATIONS_READ]: "Ler integrações",
  [PERMISSIONS.INTEGRATIONS_MANAGE]: "Gerenciar integrações",
  [PERMISSIONS.SYSTEM_SETTINGS_MANAGE]: "Gerenciar configurações do sistema",
};

function moduleForPermission(permission: Permission): string {
  return permission.split(".")[0] ?? "general";
}

export async function ensureAuthorizationCatalog(db: CatalogDb): Promise<void> {
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

async function ensureAuthorizationCatalogInitialized(db: CatalogDb): Promise<void> {
  if (authorizationCatalogSeeded) {
    return;
  }

  if (!authorizationCatalogSeedingPromise) {
    authorizationCatalogSeedingPromise = (async () => {
      await ensureAuthorizationCatalog(db);
      authorizationCatalogSeeded = true;
    })().finally(() => {
      authorizationCatalogSeedingPromise = null;
    });
  }

  await authorizationCatalogSeedingPromise;
}

export async function resolveRoleIdByCode(db: CatalogDb, role: UserRole): Promise<string> {
  await ensureAuthorizationCatalogInitialized(db);

  try {
    return (await resolveRoleRowByCode(db, role)).id;
  } catch (err) {
    if (!(err instanceof RoleNotFoundError)) {
      throw err;
    }

    await ensureAuthorizationCatalog(db);
    return (await resolveRoleRowByCode(db, role)).id;
  }
}

async function resolveRoleRowByCode(db: CatalogDb, role: UserRole): Promise<{ id: string }> {
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
  db: CatalogDb,
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

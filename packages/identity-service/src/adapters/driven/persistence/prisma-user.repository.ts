import { randomUUID } from "crypto";
import { Prisma, PrismaClient } from "../../../../generated/prisma-client";
import { User } from "../../../domain/entities/user.entity";
import type { IUserRepository } from "../../../application/ports/user-repository.port";
import type { OutboxEvent } from "../../../application/ports/outbox-writer.port";
import { UserAlreadyExistsError } from "../../../application/errors";
import {
  PERMISSION_VALUES,
  USER_ROLE_VALUES,
  type Permission,
  type UserRole,
} from "../../../domain/types";
import {
  ensureAuthorizationCatalog,
  resolveRoleIdByCode,
} from "./authorization-catalog";
import { toEnvelope } from "./outbox-envelope";

function isPrismaP2002(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

function toDomainUserRole(role: string): UserRole {
  if (USER_ROLE_VALUES.includes(role as UserRole)) {
    return role as UserRole;
  }

  throw new Error(`Invalid user role from database: ${role}`);
}

function toDomainPermission(permission: string): Permission {
  if (PERMISSION_VALUES.includes(permission as Permission)) {
    return permission as Permission;
  }

  throw new Error(`Invalid permission from database: ${permission}`);
}

/**
 * Adapter: implementação do repositório User com Prisma/PostgreSQL.
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(user: User): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await ensureAuthorizationCatalog(tx);
        await tx.$executeRaw`
          INSERT INTO "users" (
            "id", "email", "name", "authorization_version", "is_active",
            "failed_login_attempts", "blocked_until", "created_at"
          )
          VALUES (
            ${user.id}, ${user.email.value}, ${user.name}, ${user.authorizationVersion},
            ${user.isActive}, ${user.failedLoginAttempts}, ${user.blockedUntil}, ${user.createdAt}
          )
          ON CONFLICT ("id") DO UPDATE SET
            "email" = EXCLUDED."email",
            "name" = EXCLUDED."name",
            "authorization_version" = EXCLUDED."authorization_version",
            "is_active" = EXCLUDED."is_active",
            "failed_login_attempts" = EXCLUDED."failed_login_attempts",
            "blocked_until" = EXCLUDED."blocked_until"
        `;
        await syncUserRoles(tx, user);
      });
    } catch (err) {
      if (isPrismaP2002(err)) {
        throw new UserAlreadyExistsError("User with this email already exists");
      }
      throw err;
    }
  }

  async saveUserAndOutbox(user: User, outboxEvent: OutboxEvent): Promise<void> {
    try {
      const envelope = toEnvelope(outboxEvent);
      await this.prisma.$transaction(async (tx) => {
        await ensureAuthorizationCatalog(tx);
        await tx.$executeRaw`
          INSERT INTO "users" (
            "id", "email", "name", "authorization_version", "is_active",
            "failed_login_attempts", "blocked_until", "created_at"
          )
          VALUES (
            ${user.id}, ${user.email.value}, ${user.name}, ${user.authorizationVersion},
            ${user.isActive}, ${user.failedLoginAttempts}, ${user.blockedUntil}, ${user.createdAt}
          )
          ON CONFLICT ("id") DO UPDATE SET
            "email" = EXCLUDED."email",
            "name" = EXCLUDED."name",
            "authorization_version" = EXCLUDED."authorization_version",
            "is_active" = EXCLUDED."is_active",
            "failed_login_attempts" = EXCLUDED."failed_login_attempts",
            "blocked_until" = EXCLUDED."blocked_until"
        `;
        await syncUserRoles(tx, user);
        await tx.outboxModel.create({
          data: {
            id: randomUUID(),
            eventName: outboxEvent.eventName,
            payload: envelope as object,
            createdAt: new Date(),
          },
        });
      });
    } catch (err) {
      if (isPrismaP2002(err)) {
        throw new UserAlreadyExistsError("User with this email already exists");
      }
      throw err;
    }
  }

  async findById(id: string): Promise<User | null> {
    const row = (await this.prisma.$queryRaw<Array<UserRow>>`
      SELECT
        u."id",
        u."email",
        u."name",
        u."authorization_version" AS "authorizationVersion",
        u."is_active" AS "isActive",
        u."failed_login_attempts" AS "failedLoginAttempts",
        u."blocked_until" AS "blockedUntil",
        u."created_at" AS "createdAt"
      FROM "users" u
      WHERE u."id" = ${id}
      LIMIT 1
    `)[0];
    if (!row) return null;
    return this.toDomainUser(
      row,
      await this.findRolesByUserId(row.id),
      await this.findPermissionsByUserId(row.id)
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = (await this.prisma.$queryRaw<Array<UserRow>>`
      SELECT
        u."id",
        u."email",
        u."name",
        u."authorization_version" AS "authorizationVersion",
        u."is_active" AS "isActive",
        u."failed_login_attempts" AS "failedLoginAttempts",
        u."blocked_until" AS "blockedUntil",
        u."created_at" AS "createdAt"
      FROM "users" u
      WHERE u."email" = ${email}
      LIMIT 1
    `)[0];
    if (!row) return null;
    return this.toDomainUser(
      row,
      await this.findRolesByUserId(row.id),
      await this.findPermissionsByUserId(row.id)
    );
  }

  private async findRolesByUserId(userId: string): Promise<Array<{ code: UserRole; isPrimary: boolean }>> {
    const rows = await this.prisma.$queryRaw<Array<{ code: string; isPrimary: boolean }>>`
      SELECT r."code", ur."is_primary" AS "isPrimary"
      FROM "user_roles" ur
      INNER JOIN "roles" r ON r."id" = ur."role_id"
      WHERE ur."user_id" = ${userId}
      ORDER BY ur."is_primary" DESC, r."code" ASC
    `;

    return rows.map((row) => ({
      code: toDomainUserRole(row.code),
      isPrimary: row.isPrimary,
    }));
  }

  private async findPermissionsByUserId(userId: string): Promise<Permission[]> {
    const rows = await this.prisma.$queryRaw<Array<{ code: string }>>`
      SELECT DISTINCT p."code"
      FROM "permissions" p
      INNER JOIN "role_permissions" rp ON rp."permission_id" = p."id"
      INNER JOIN "user_roles" ur ON ur."role_id" = rp."role_id"
      WHERE ur."user_id" = ${userId}
      ORDER BY p."code" ASC
    `;
    const permissions = rows.map((row) => toDomainPermission(row.code));
    return PERMISSION_VALUES.filter((permission) => permissions.includes(permission as Permission)) as Permission[];
  }

  private toDomainUser(
    row: UserRow,
    roleRows: Array<{ code: UserRole; isPrimary: boolean }>,
    permissions: Permission[]
  ): User {
    const primaryRole = roleRows.find((role) => role.isPrimary)?.code ?? roleRows[0]?.code;
    if (!primaryRole) {
      throw new Error(`User ${row.id} does not have an assigned role`);
    }
    const roles = roleRows.map((role) => role.code);

    return User.reconstitute(
      row.id,
      row.email,
      row.name,
      row.createdAt,
      primaryRole,
      roles,
      permissions,
      row.authorizationVersion,
      row.isActive,
      row.failedLoginAttempts,
      row.blockedUntil
    );
  }
}

async function syncUserRoles(
  tx: Prisma.TransactionClient,
  user: User
): Promise<void> {
  const resolvedRoles = await Promise.all(
    user.roles.map(async (role) => ({
      roleId: await resolveRoleIdByCode(tx, role),
      isPrimary: role === user.primaryRole,
    }))
  );

  await tx.$executeRaw`
    UPDATE "user_roles"
    SET "is_primary" = false
    WHERE "user_id" = ${user.id}
  `;

  const roleIds = resolvedRoles.map((role) => role.roleId);
  if (roleIds.length === 0) {
    await tx.$executeRaw`
      DELETE FROM "user_roles"
      WHERE "user_id" = ${user.id}
    `;
  } else {
    await tx.$executeRaw(
      Prisma.sql`
        DELETE FROM "user_roles"
        WHERE "user_id" = ${user.id}
          AND "role_id" NOT IN (${Prisma.join(roleIds)})
      `
    );
  }

  for (const role of resolvedRoles) {
    await tx.$executeRaw`
      INSERT INTO "user_roles" ("user_id", "role_id", "is_primary", "assigned_at")
      VALUES (${user.id}, ${role.roleId}, ${role.isPrimary}, NOW())
      ON CONFLICT ("user_id", "role_id") DO UPDATE SET
        "is_primary" = EXCLUDED."is_primary",
        "assigned_at" = NOW()
    `;
  }
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  authorizationVersion: number;
  isActive: boolean;
  failedLoginAttempts: number;
  blockedUntil: Date | null;
  createdAt: Date;
}

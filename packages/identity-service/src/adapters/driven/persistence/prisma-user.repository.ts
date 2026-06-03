import { randomUUID } from "crypto";
import { Prisma, PrismaClient } from "../../../../generated/prisma-client";
import { logger, type IAuthzVersionChecker } from "@lframework/shared";
import { User } from "../../../domain/entities/user.entity";
import type { IUserRepository } from "../../../application/ports";
import type { OutboxEvent } from "../../../application/ports";
import type { ListUsersQueryDto } from "../../../application/dtos";
import { UserAlreadyExistsError } from "../../../application/errors";
import {
  PERMISSION_VALUES,
  USER_ROLE_VALUES,
  type Permission,
  type UserRole,
} from "../../../domain/types";
import {
  ensureAuthorizationRegistry,
  resolveRoleIdByCode,
} from "./authorization-registry";
import { toEnvelope } from "./outbox-envelope";

function isPrismaP2002(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

function toDomainUserRole(role: string): UserRole {
  const normalized = role.trim().toLowerCase();
  if (USER_ROLE_VALUES.includes(normalized as UserRole)) {
    return normalized as UserRole;
  }

  throw new Error(`Invalid user role from database: ${role}`);
}

function toDomainPermission(permission: string): Permission | null {
  const normalized = normalizeLegacyPermissionCode(permission);
  if (PERMISSION_VALUES.includes(normalized as Permission)) {
    return normalized as Permission;
  }

  logger.warn(
    { permission, normalizedPermission: normalized },
    "Ignoring unknown permission code from database"
  );
  return null;
}

function normalizeLegacyPermissionCode(permission: string): string {
  const normalizedPermission = permission.trim().toLowerCase();
  switch (normalizedPermission) {
    case "catalog.items.read":
      return "compliance.violations.read";
    case "catalog.items.create":
      return "compliance.violations.create";
    case "catalog.test.access":
      return "compliance.test.access";
    default:
      return normalizedPermission;
  }
}

/**
 * Adapter: implementação do repositório User com Prisma/PostgreSQL.
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly authzVersionChecker?: IAuthzVersionChecker
  ) {}

  async save(user: User): Promise<void> {
    try {
      await this.persistUserWithOutboxEvents(user, []);
    } catch (err) {
      if (isPrismaP2002(err)) {
        throw new UserAlreadyExistsError("User with this email already exists");
      }
      throw err;
    }
  }

  async saveUserAndOutbox(user: User, outboxEvent: OutboxEvent): Promise<void> {
    try {
      await this.persistUserWithOutboxEvents(user, [outboxEvent]);
    } catch (err) {
      if (isPrismaP2002(err)) {
        throw new UserAlreadyExistsError("User with this email already exists");
      }
      throw err;
    }
  }

  async saveUserAndOutboxBatch(user: User, outboxEvents: OutboxEvent[]): Promise<void> {
    try {
      await this.persistUserWithOutboxEvents(user, outboxEvents);
    } catch (err) {
      if (isPrismaP2002(err)) {
        throw new UserAlreadyExistsError("User with this email already exists");
      }
      throw err;
    }
  }

  private async persistUserWithOutboxEvents(user: User, outboxEvents: OutboxEvent[]): Promise<void> {
    const envelopes = outboxEvents.map((event) => ({
      eventName: event.eventName,
      payload: toEnvelope(event) as object,
    }));

    await this.prisma.$transaction(async (tx) => {
      await ensureAuthorizationRegistry(tx);
      await tx.$executeRaw`
        INSERT INTO "users" (
          "id", "email", "name", "password_hash", "authorization_version", "is_active",
          "deactivated_at", "failed_login_attempts", "blocked_until", "created_at"
        )
        VALUES (
          ${user.id}, ${user.email.value}, ${user.name}, ${user.passwordHash}, ${user.authorizationVersion},
          ${user.isActive}, ${user.deactivatedAt}, ${user.failedLoginAttempts}, ${user.blockedUntil}, ${user.createdAt}
        )
        ON CONFLICT ("id") DO UPDATE SET
          "email" = EXCLUDED."email",
          "name" = EXCLUDED."name",
          "password_hash" = EXCLUDED."password_hash",
          "authorization_version" = EXCLUDED."authorization_version",
          "is_active" = EXCLUDED."is_active",
          "deactivated_at" = EXCLUDED."deactivated_at",
          "failed_login_attempts" = EXCLUDED."failed_login_attempts",
          "blocked_until" = EXCLUDED."blocked_until"
      `;
      await syncUserRoles(tx, user);
      for (const envelope of envelopes) {
        await tx.outboxModel.create({
          data: {
            id: randomUUID(),
            eventName: envelope.eventName,
            payload: envelope.payload,
            createdAt: new Date(),
          },
        });
      }
    });

    if (this.authzVersionChecker) {
      await this.authzVersionChecker.updateVersion(user.id, user.authorizationVersion);
    }
  }

  async findById(id: string): Promise<User | null> {
    const row = (await this.prisma.$queryRaw<Array<UserRow>>`
      SELECT
        u."id",
        u."email",
        u."name",
        u."password_hash" AS "passwordHash",
        u."authorization_version" AS "authorizationVersion",
        u."is_active" AS "isActive",
        u."deactivated_at" AS "deactivatedAt",
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
        u."password_hash" AS "passwordHash",
        u."authorization_version" AS "authorizationVersion",
        u."is_active" AS "isActive",
        u."deactivated_at" AS "deactivatedAt",
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

  async countUsers(): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COUNT(*)::int AS total FROM "users"
    `;
    return rows[0]?.total ?? 0;
  }

  async list(query: ListUsersQueryDto): Promise<{ items: User[]; total: number }> {
    const whereParts: string[] = [];
    const values: unknown[] = [];

    if (query.search) {
      values.push(`%${query.search.toLowerCase()}%`);
      whereParts.push(`(LOWER(u."name") LIKE $${values.length} OR LOWER(u."email") LIKE $${values.length})`);
    }

    const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
    const offset = (query.page - 1) * query.pageSize;

    const countRows = await this.prisma.$queryRawUnsafe<Array<{ total: number }>>(
      `SELECT COUNT(*)::int AS total FROM "users" u ${whereSql}`,
      ...values
    );
    const total = countRows[0]?.total ?? 0;

    values.push(query.pageSize);
    const takeIndex = values.length;
    values.push(offset);
    const skipIndex = values.length;

    const rows = await this.prisma.$queryRawUnsafe<Array<UserRow>>(
      `
      SELECT
        u."id",
        u."email",
        u."name",
        u."password_hash" AS "passwordHash",
        u."authorization_version" AS "authorizationVersion",
        u."is_active" AS "isActive",
        u."deactivated_at" AS "deactivatedAt",
        u."failed_login_attempts" AS "failedLoginAttempts",
        u."blocked_until" AS "blockedUntil",
        u."created_at" AS "createdAt"
      FROM "users" u
      ${whereSql}
      ORDER BY u."created_at" DESC
      LIMIT $${takeIndex}
      OFFSET $${skipIndex}
      `,
      ...values
    );

    const items = await Promise.all(
      rows.map(async (row) =>
        this.toDomainUser(
          row,
          await this.findRolesByUserId(row.id),
          await this.findPermissionsByUserId(row.id)
        ))
    );

    return { items, total };
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
    const permissions = rows
      .map((row) => toDomainPermission(row.code))
      .filter((permission): permission is Permission => permission !== null);
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
      row.deactivatedAt,
      row.failedLoginAttempts,
      row.blockedUntil,
      row.passwordHash
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
  passwordHash: string | null;
  authorizationVersion: number;
  isActive: boolean;
  deactivatedAt: Date | null;
  failedLoginAttempts: number;
  blockedUntil: Date | null;
  createdAt: Date;
}

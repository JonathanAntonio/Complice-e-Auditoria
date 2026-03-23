import { randomUUID } from "crypto";
import { PrismaClient } from "../../../../generated/prisma-client";
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
        const roleId = await resolveRoleIdByCode(tx, user.primaryRole);
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
        await tx.$executeRaw`
          INSERT INTO "user_roles" ("id", "user_id", "role_id", "assigned_at")
          VALUES (${randomUUID()}, ${user.id}, ${roleId}, NOW())
          ON CONFLICT ("user_id") DO UPDATE SET
            "role_id" = EXCLUDED."role_id",
            "assigned_at" = NOW()
        `;
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
      await this.prisma.$transaction(async (tx) => {
        await ensureAuthorizationCatalog(tx);
        const roleId = await resolveRoleIdByCode(tx, user.primaryRole);
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
        await tx.$executeRaw`
          INSERT INTO "user_roles" ("id", "user_id", "role_id", "assigned_at")
          VALUES (${randomUUID()}, ${user.id}, ${roleId}, NOW())
          ON CONFLICT ("user_id") DO UPDATE SET
            "role_id" = EXCLUDED."role_id",
            "assigned_at" = NOW()
        `;
        await tx.outboxModel.create({
          data: {
            id: randomUUID(),
            eventName: outboxEvent.eventName,
            payload: outboxEvent.payload as object,
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
    const row = (await this.prisma.$queryRaw<Array<UserAuthorizationRow>>`
      SELECT
        u."id",
        u."email",
        u."name",
        u."authorization_version" AS "authorizationVersion",
        u."is_active" AS "isActive",
        u."failed_login_attempts" AS "failedLoginAttempts",
        u."blocked_until" AS "blockedUntil",
        u."created_at" AS "createdAt",
        r."code" AS "primaryRole"
      FROM "users" u
      LEFT JOIN "user_roles" ur ON ur."user_id" = u."id"
      LEFT JOIN "roles" r ON r."id" = ur."role_id"
      WHERE u."id" = ${id}
      LIMIT 1
    `)[0];
    if (!row) return null;
    return this.toDomainUser(row, await this.findPermissionsByUserId(row.id));
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = (await this.prisma.$queryRaw<Array<UserAuthorizationRow>>`
      SELECT
        u."id",
        u."email",
        u."name",
        u."authorization_version" AS "authorizationVersion",
        u."is_active" AS "isActive",
        u."failed_login_attempts" AS "failedLoginAttempts",
        u."blocked_until" AS "blockedUntil",
        u."created_at" AS "createdAt",
        r."code" AS "primaryRole"
      FROM "users" u
      LEFT JOIN "user_roles" ur ON ur."user_id" = u."id"
      LEFT JOIN "roles" r ON r."id" = ur."role_id"
      WHERE u."email" = ${email}
      LIMIT 1
    `)[0];
    if (!row) return null;
    return this.toDomainUser(row, await this.findPermissionsByUserId(row.id));
  }

  private async findPermissionsByUserId(userId: string): Promise<Permission[]> {
    const rows = await this.prisma.$queryRaw<Array<{ code: string }>>`
      SELECT p."code"
      FROM "permissions" p
      INNER JOIN "role_permissions" rp ON rp."permission_id" = p."id"
      INNER JOIN "user_roles" ur ON ur."role_id" = rp."role_id"
      WHERE ur."user_id" = ${userId}
      ORDER BY p."code" ASC
    `;
    return rows.map((row) => toDomainPermission(row.code));
  }

  private toDomainUser(row: UserAuthorizationRow, permissions: Permission[]): User {
    if (!row.primaryRole) {
      throw new Error(`User ${row.id} does not have an assigned role`);
    }

    return User.reconstitute(
      row.id,
      row.email,
      row.name,
      row.createdAt,
      toDomainUserRole(row.primaryRole),
      permissions,
      row.authorizationVersion,
      row.isActive,
      row.failedLoginAttempts,
      row.blockedUntil
    );
  }
}

interface UserAuthorizationRow {
  id: string;
  email: string;
  name: string;
  authorizationVersion: number;
  isActive: boolean;
  failedLoginAttempts: number;
  blockedUntil: Date | null;
  createdAt: Date;
  primaryRole: string | null;
}

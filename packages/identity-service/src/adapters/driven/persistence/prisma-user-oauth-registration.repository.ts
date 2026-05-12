import { randomUUID } from "crypto";
import { PrismaClient } from "../../../../generated/prisma-client";
import type { IUserOAuthRegistrationPersistence } from "../../../application/ports";
import type { OAuthProvider } from "../../../application/ports";
import type { OutboxEvent } from "../../../application/ports";
import { User } from "../../../domain/entities/user.entity";
import { UserAlreadyExistsError } from "../../../application/errors";
import {
  ensureAuthorizationRegistry,
  resolveRoleIdByCode,
} from "./authorization-registry";
import { toEnvelope } from "./outbox-envelope";

function isPrismaP2002(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

/**
 * Adapter: persiste usuário e conta OAuth em uma única transação.
 * Optionally appends an outbox event in the same transaction (Outbox Pattern).
 */
export class PrismaUserOAuthRegistrationPersistence implements IUserOAuthRegistrationPersistence {
  constructor(private readonly prisma: PrismaClient) {}

  async saveUserAndOAuthAccount(
    user: User,
    provider: OAuthProvider,
    providerId: string,
    outboxEvent?: OutboxEvent
  ): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await ensureAuthorizationRegistry(tx);
        const resolvedRoles = await Promise.all(
          user.roles.map(async (role) => ({
            roleId: await resolveRoleIdByCode(tx, role),
            isPrimary: role === user.primaryRole,
            roleCode: role,
          }))
        );
        for (const role of resolvedRoles) {
          if (!role.roleId) {
            throw new Error(`Role code not found for OAuth user registration: ${role.roleCode}`);
          }
        }
        await tx.$executeRaw`
          INSERT INTO "users" (
            "id", "email", "name", "authorization_version", "created_at"
          )
          VALUES (
            ${user.id}, ${user.email.value}, ${user.name}, ${user.authorizationVersion}, ${user.createdAt}
          )
        `;
        for (const role of resolvedRoles) {
          await tx.$executeRaw`
            INSERT INTO "user_roles" ("user_id", "role_id", "is_primary", "assigned_at")
            VALUES (${user.id}, ${role.roleId}, ${role.isPrimary}, NOW())
          `;
        }
        await tx.oAuthAccountModel.create({
          data: {
            userId: user.id,
            provider,
            providerId,
            createdAt: new Date(),
          },
        });
        if (outboxEvent) {
          const envelope = toEnvelope(outboxEvent);
          await tx.outboxModel.create({
            data: {
              id: randomUUID(),
              eventName: outboxEvent.eventName,
              payload: envelope as object,
              createdAt: new Date(),
            },
          });
        }
      });
    } catch (err) {
      if (isPrismaP2002(err)) {
        throw new UserAlreadyExistsError("User with this email already exists");
      }
      throw err;
    }
  }
}

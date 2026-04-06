import { randomUUID } from "crypto";
import { PrismaClient } from "../../../../generated/prisma-client";
import type { IUserOAuthRegistrationPersistence } from "../../../application/ports/user-oauth-registration-persistence.port";
import type { OAuthProvider } from "../../../application/ports/oauth-account-repository.port";
import type { OutboxEvent } from "../../../application/ports/outbox-writer.port";
import { User } from "../../../domain/entities/user.entity";
import { UserAlreadyExistsError } from "../../../application/errors";
import {
  ensureAuthorizationCatalog,
  resolveRoleIdByCode,
} from "./authorization-catalog";
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
        await ensureAuthorizationCatalog(tx);
        const roleId = await resolveRoleIdByCode(tx, user.primaryRole);
        if (!roleId) {
          throw new Error(`Role code not found for OAuth user registration: ${user.primaryRole}`);
        }
        await tx.$executeRaw`
          INSERT INTO "users" (
            "id", "email", "name", "authorization_version", "created_at"
          )
          VALUES (
            ${user.id}, ${user.email.value}, ${user.name}, ${user.authorizationVersion}, ${user.createdAt}
          )
        `;
        await tx.$executeRaw`
          INSERT INTO "user_roles" ("user_id", "role_id", "is_primary", "assigned_at")
          VALUES (${user.id}, ${roleId}, true, NOW())
        `;
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

import { randomUUID } from "crypto";
import { PrismaClient } from "../../../../generated/prisma-client";
import type { IUserRegistrationPersistence } from "../../../application/ports/user-registration-persistence.port";
import type { OutboxEvent } from "../../../application/ports/outbox-writer.port";
import { User } from "../../../domain/entities/user.entity";
import { UserAlreadyExistsError } from "../../../application/errors";
import {
  ensureAuthorizationCatalog,
  resolveRoleIdByCode,
} from "./authorization-catalog";

function isPrismaP2002(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

/**
 * Adapter: persiste usuário e credencial em uma única transação.
 * Optionally appends an outbox event in the same transaction (Outbox Pattern).
 */
export class PrismaUserRegistrationPersistence implements IUserRegistrationPersistence {
  constructor(private readonly prisma: PrismaClient) {}

  async saveUserAndCredential(
    user: User,
    passwordHash: string,
    outboxEvent?: OutboxEvent
  ): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await ensureAuthorizationCatalog(tx);
        const roleId = await resolveRoleIdByCode(tx, user.primaryRole);
        if (!roleId) {
          throw new Error(`Role code not found for user registration: ${user.primaryRole}`);
        }
        await tx.$executeRaw`
          INSERT INTO "users" (
            "id", "email", "name", "authorization_version", "created_at"
          )
          VALUES (
            ${user.id}, ${user.email.value}, ${user.name}, ${user.authorizationVersion}, ${user.createdAt}
          )
          ON CONFLICT ("id") DO UPDATE SET
            "email" = EXCLUDED."email",
            "name" = EXCLUDED."name",
            "authorization_version" = EXCLUDED."authorization_version"
        `;
        await tx.$executeRaw`
          INSERT INTO "user_roles" ("user_id", "role_id", "assigned_at")
          VALUES (${user.id}, ${roleId}, NOW())
          ON CONFLICT ("user_id") DO UPDATE SET
            "role_id" = EXCLUDED."role_id",
            "assigned_at" = NOW()
        `;
        await tx.authCredentialModel.upsert({
          where: { userId: user.id },
          create: { userId: user.id, passwordHash },
          update: { passwordHash },
        });
        if (outboxEvent) {
          await tx.outboxModel.create({
            data: {
              id: randomUUID(),
              eventName: outboxEvent.eventName,
              payload: outboxEvent.payload as object,
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

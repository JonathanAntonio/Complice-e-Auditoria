import { randomUUID } from "crypto";
import { PrismaClient } from "../../../../generated/prisma-client";
import { User } from "../../../domain/entities/user.entity";
import type { IUserRepository } from "../../../application/ports/user-repository.port";
import type { OutboxEvent } from "../../../application/ports/outbox-writer.port";
import { UserAlreadyExistsError } from "../../../application/errors";
import { USER_ROLE_VALUES, type UserRole } from "../../../domain/types";

function isPrismaP2002(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

function toDomainUserRole(role: string): UserRole {
  if (USER_ROLE_VALUES.includes(role as UserRole)) {
    return role as UserRole;
  }

  throw new Error(`Invalid user role from database: ${role}`);
}

/**
 * Adapter: implementação do repositório User com Prisma/PostgreSQL.
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(user: User): Promise<void> {
    try {
      await this.prisma.userModel.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          email: user.email.value,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          failedLoginAttempts: user.failedLoginAttempts,
          blockedUntil: user.blockedUntil,
          createdAt: user.createdAt,
        },
        update: {
          email: user.email.value,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          failedLoginAttempts: user.failedLoginAttempts,
          blockedUntil: user.blockedUntil,
        },
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
      await this.prisma.$transaction([
        this.prisma.userModel.upsert({
          where: { id: user.id },
          create: {
            id: user.id,
            email: user.email.value,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            failedLoginAttempts: user.failedLoginAttempts,
            blockedUntil: user.blockedUntil,
            createdAt: user.createdAt,
          },
          update: {
            email: user.email.value,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            failedLoginAttempts: user.failedLoginAttempts,
            blockedUntil: user.blockedUntil,
          },
        }),
        this.prisma.outboxModel.create({
          data: {
            id: randomUUID(),
            eventName: outboxEvent.eventName,
            payload: outboxEvent.payload as object,
            createdAt: new Date(),
          },
        }),
      ]);
    } catch (err) {
      if (isPrismaP2002(err)) {
        throw new UserAlreadyExistsError("User with this email already exists");
      }
      throw err;
    }
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.userModel.findUnique({
      where: { id },
    });
    if (!row) return null;
    return User.reconstitute(
      row.id,
      row.email,
      row.name,
      row.createdAt,
      toDomainUserRole(row.role),
      row.isActive,
      row.failedLoginAttempts,
      row.blockedUntil
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.userModel.findUnique({
      where: { email },
    });
    if (!row) return null;
    return User.reconstitute(
      row.id,
      row.email,
      row.name,
      row.createdAt,
      toDomainUserRole(row.role),
      row.isActive,
      row.failedLoginAttempts,
      row.blockedUntil
    );
  }
}

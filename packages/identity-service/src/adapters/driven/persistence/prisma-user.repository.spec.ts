import { describe, expect, it, vi } from "vitest";
import { PrismaUserRepository } from "./prisma-user.repository";

describe("PrismaUserRepository", () => {
  it("should fail clearly when reconstituting user with invalid role from DB", async () => {
    const prisma = {
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: "user-1",
            email: "u@example.com",
            name: "Nome",
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
            authorizationVersion: 1,
            isActive: true,
            failedLoginAttempts: 0,
            blockedUntil: null,
            primaryRole: "super_admin",
          },
        ])
        .mockResolvedValueOnce([]),
    } as any;

    const repository = new PrismaUserRepository(prisma);

    await expect(repository.findById("user-1")).rejects.toThrow(
      "Invalid user role from database: super_admin"
    );
  });
});

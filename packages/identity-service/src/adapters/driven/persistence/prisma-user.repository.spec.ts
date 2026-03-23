import { describe, expect, it, vi } from "vitest";
import { PrismaUserRepository } from "./prisma-user.repository";

describe("PrismaUserRepository", () => {
  it("deve falhar claramente ao reconstituir usuário com role inválido do banco", async () => {
    const prisma = {
      userModel: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-1",
          email: "u@example.com",
          name: "Nome",
          createdAt: new Date("2025-01-01T00:00:00.000Z"),
          role: "super_admin",
          isActive: true,
          failedLoginAttempts: 0,
          blockedUntil: null,
        }),
      },
    } as any;

    const repository = new PrismaUserRepository(prisma);

    await expect(repository.findById("user-1")).rejects.toThrow(
      "Invalid user role from database: super_admin"
    );
  });
});

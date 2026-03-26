import { describe, expect, it, vi } from "vitest";
import { PrismaUserRepository } from "./prisma-user.repository";
import { PERMISSIONS, USER_ROLES } from "../../../domain/types";

describe("PrismaUserRepository", () => {
  it("should return a mapped user on happy path", async () => {
    const createdAt = new Date("2025-01-01T00:00:00.000Z");
    const blockedUntil = new Date("2025-01-02T00:00:00.000Z");
    const prisma = {
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: "user-1",
            email: "u@example.com",
            name: "Nome",
            createdAt,
            authorizationVersion: 3,
            isActive: true,
            failedLoginAttempts: 1,
            blockedUntil,
          },
        ])
        .mockResolvedValueOnce([{ code: USER_ROLES.GESTOR, isPrimary: true }])
        .mockResolvedValueOnce([{ code: PERMISSIONS.CATALOG_ITEMS_READ }]),
    } as any;

    const repository = new PrismaUserRepository(prisma);
    const user = await repository.findById("user-1");

    expect(user).not.toBeNull();
    expect(user!.id).toBe("user-1");
    expect(user!.email.value).toBe("u@example.com");
    expect(user!.primaryRole).toBe(USER_ROLES.GESTOR);
    expect(user!.roles).toEqual([USER_ROLES.GESTOR]);
    expect(user!.permissions).toContain(PERMISSIONS.CATALOG_ITEMS_READ);
    expect(user!.authorizationVersion).toBe(3);
    expect(user!.isActive).toBe(true);
    expect(user!.failedLoginAttempts).toBe(1);
    expect(user!.blockedUntil?.toISOString()).toBe("2025-01-02T00:00:00.000Z");
  });

  it("should return null when user is not found", async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValueOnce([]),
    } as any;

    const repository = new PrismaUserRepository(prisma);
    await expect(repository.findById("missing-user")).resolves.toBeNull();
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("should pick the primary role when multiple roles are present", async () => {
    const prisma = {
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: "user-1",
            email: "u@example.com",
            name: "Nome",
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
            authorizationVersion: 2,
            isActive: true,
            failedLoginAttempts: 0,
            blockedUntil: null,
          },
        ])
        .mockResolvedValueOnce([
          { code: USER_ROLES.VISUALIZADOR, isPrimary: false },
          { code: USER_ROLES.ADMINISTRADOR, isPrimary: true },
        ])
        .mockResolvedValueOnce([{ code: PERMISSIONS.USERS_CREATE }]),
    } as any;

    const repository = new PrismaUserRepository(prisma);
    const user = await repository.findById("user-1");

    expect(user).not.toBeNull();
    expect(user!.primaryRole).toBe(USER_ROLES.ADMINISTRADOR);
    expect(user!.roles).toEqual([USER_ROLES.VISUALIZADOR, USER_ROLES.ADMINISTRADOR]);
  });

  it("should map inactive users and null blockedUntil values", async () => {
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
            isActive: false,
            failedLoginAttempts: 4,
            blockedUntil: null,
          },
        ])
        .mockResolvedValueOnce([{ code: USER_ROLES.VISUALIZADOR, isPrimary: true }])
        .mockResolvedValueOnce([]),
    } as any;

    const repository = new PrismaUserRepository(prisma);
    const user = await repository.findById("user-1");

    expect(user).not.toBeNull();
    expect(user!.isActive).toBe(false);
    expect(user!.failedLoginAttempts).toBe(4);
    expect(user!.blockedUntil).toBeNull();
  });

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
          },
        ])
        .mockResolvedValueOnce([{ code: "super_admin", isPrimary: true }])
        .mockResolvedValueOnce([]),
    } as any;

    const repository = new PrismaUserRepository(prisma);

    await expect(repository.findById("user-1")).rejects.toThrow(
      "Invalid user role from database: super_admin"
    );
  });

  it("should fail when user row has invalid/null email", async () => {
    const prisma = {
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: "user-1",
            email: null,
            name: "Nome",
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
            authorizationVersion: 1,
            isActive: true,
            failedLoginAttempts: 0,
            blockedUntil: null,
          },
        ])
        .mockResolvedValueOnce([{ code: USER_ROLES.VISUALIZADOR, isPrimary: true }])
        .mockResolvedValueOnce([]),
    } as any;

    const repository = new PrismaUserRepository(prisma);
    await expect(repository.findById("user-1")).rejects.toThrow();
  });
});

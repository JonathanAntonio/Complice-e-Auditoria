import { describe, expect, it } from "vitest";
import { User } from "./user.entity";
import { Email } from "../value-objects/email.vo";
import { USER_ROLES } from "../types";

describe("User", () => {
  it("deve retornar cópia defensiva de blockedUntil", () => {
    const originalBlockedUntil = new Date("2025-01-02T00:00:00.000Z");
    const user = User.reconstituteLegacy(
      "user-1",
      "u@example.com",
      "Nome",
      new Date("2025-01-01T00:00:00.000Z"),
      USER_ROLES.VISUALIZADOR,
      true,
      5,
      originalBlockedUntil
    );

    const blockedUntil = user.blockedUntil;
    blockedUntil!.setUTCFullYear(2030);

    expect(user.blockedUntil?.toISOString()).toBe("2025-01-02T00:00:00.000Z");
  });

  it("não deve estender bloqueio ao registrar falha enquanto já bloqueado", () => {
    const user = User.reconstituteLegacy(
      "user-1",
      "u@example.com",
      "Nome",
      new Date("2025-01-01T00:00:00.000Z"),
      USER_ROLES.VISUALIZADOR,
      true,
      5,
      new Date("2025-01-01T00:15:00.000Z")
    );

    user.recordFailedLogin(new Date("2025-01-01T00:10:00.000Z"), 5, 15 * 60 * 1000);

    expect(user.failedLoginAttempts).toBe(5);
    expect(user.blockedUntil?.toISOString()).toBe("2025-01-01T00:15:00.000Z");
  });

  it("deve retornar cópia defensiva de createdAt", () => {
    const user = User.create("user-1", Email.create("u@example.com"), "Nome");

    const createdAt = user.createdAt;
    createdAt.setUTCFullYear(2030);

    expect(user.createdAt.getUTCFullYear()).not.toBe(2030);
  });
});

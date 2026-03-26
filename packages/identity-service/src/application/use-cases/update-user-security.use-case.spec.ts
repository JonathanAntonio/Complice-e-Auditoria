import { describe, it, expect, vi } from "vitest";
import { UpdateUserSecurityUseCase } from "./update-user-security.use-case";
import { User } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-objects/email.vo";
import { USER_ROLES, PERMISSIONS } from "../../domain/types";
import { SECURITY_AUDIT_EVENTS } from "../security-audit";
import { AuthorizationError } from "../errors";

function buildUser(id: string, role = USER_ROLES.VISUALIZADOR): User {
  return User.create(id, Email.create(`${id}@example.com`), `User ${id}`, role, [role]);
}

describe("UpdateUserSecurityUseCase", () => {
  it("updates status fields and emits audit event", async () => {
    const target = buildUser("target");
    const actor = buildUser("actor", USER_ROLES.ADMINISTRADOR);
    const saveUserAndOutbox = vi.fn().mockResolvedValue(undefined);

    const repository = {
      findById: vi.fn(async (id: string) => (id === "target" ? target : actor)),
      saveUserAndOutbox,
    };

    const useCase = new UpdateUserSecurityUseCase(repository as never);
    const blockedUntil = new Date(Date.now() + 10 * 60 * 1000);

    const result = await useCase.execute(
      "target",
      { isActive: false, blockedUntil },
      "actor",
      { requestId: "req-1" }
    );

    expect(result).toMatchObject({ id: "target", isActive: false });
    expect(saveUserAndOutbox).toHaveBeenCalledWith(
      target,
      expect.objectContaining({
        eventName: SECURITY_AUDIT_EVENTS.USER_SECURITY_CHANGED,
      })
    );
  });

  it("throws when actor does not have users.update permission", async () => {
    const target = buildUser("target");
    const actor = buildUser("actor", USER_ROLES.VISUALIZADOR);
    const repository = {
      findById: vi.fn(async (id: string) => (id === "target" ? target : actor)),
      saveUserAndOutbox: vi.fn(),
    };

    const useCase = new UpdateUserSecurityUseCase(repository as never);

    await expect(useCase.execute("target", { isActive: false }, "actor")).rejects.toBeInstanceOf(
      AuthorizationError
    );
    expect(actor.permissions).not.toContain(PERMISSIONS.USERS_UPDATE);
  });
});

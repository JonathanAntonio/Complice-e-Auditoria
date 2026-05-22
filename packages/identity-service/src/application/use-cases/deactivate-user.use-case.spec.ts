import { describe, it, expect, vi } from "vitest";
import { DeactivateUserUseCase } from "./deactivate-user.use-case";
import { User } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-objects/email.vo";
import { USER_ROLES, PERMISSIONS } from "../../domain/types";
import { SECURITY_AUDIT_EVENTS } from "../security-audit";
import { AuthorizationError } from "../errors";

function buildUser(id: string, role = USER_ROLES.VISUALIZADOR): User {
  return User.create(id, Email.create(`${id}@example.com`), `User ${id}`, role, [role]);
}

describe("DeactivateUserUseCase", () => {
  it("deactivates user and writes audit event", async () => {
    const target = buildUser("target");
    const actor = buildUser("actor", USER_ROLES.ADMINISTRADOR);
    const saveUserAndOutbox = vi.fn().mockResolvedValue(undefined);
    const repository = {
      findById: vi.fn(async (id: string) => (id === "target" ? target : actor)),
      saveUserAndOutbox,
    };

    const useCase = new DeactivateUserUseCase(repository as never);
    const result = await useCase.execute("target", "actor", { requestId: "req-1" });

    expect(result).toMatchObject({ id: "target", isActive: false });
    expect(result?.authzVersion).toBe(2);
    expect(saveUserAndOutbox).toHaveBeenCalledWith(
      target,
      expect.objectContaining({
        eventName: SECURITY_AUDIT_EVENTS.USER_DEACTIVATED,
        payload: expect.objectContaining({
          authzVersion: 2,
        }),
      })
    );
  });

  it("throws when actor lacks users.deactivate permission", async () => {
    const target = buildUser("target");
    const actor = buildUser("actor", USER_ROLES.VISUALIZADOR);
    const repository = {
      findById: vi.fn(async (id: string) => (id === "target" ? target : actor)),
      saveUserAndOutbox: vi.fn(),
    };

    const useCase = new DeactivateUserUseCase(repository as never);

    await expect(useCase.execute("target", "actor")).rejects.toBeInstanceOf(AuthorizationError);
    expect(actor.permissions).not.toContain(PERMISSIONS.USERS_DEACTIVATE);
  });
});

import { describe, it, expect, vi } from "vitest";
import { LogoutUseCase } from "./logout.use-case";
import { SECURITY_AUDIT_EVENTS } from "../security-audit";
import { User } from "../../domain/entities/user.entity";
import { USER_ROLES } from "../../domain/types";

describe("LogoutUseCase", () => {
  it("appends logout audit event", async () => {
    const user = User.reconstitute(
      "user-1",
      "u@example.com",
      "Nome",
      new Date("2025-01-01T00:00:00.000Z"),
      USER_ROLES.VISUALIZADOR
    );
    const userRepository = {
      findById: vi.fn().mockResolvedValue(user),
      saveUserAndOutbox: vi.fn().mockResolvedValue(undefined),
    };
    const useCase = new LogoutUseCase(userRepository as never, {} as never);

    await useCase.execute("user-1", 1, {
      ipAddress: "10.0.0.1",
      requestId: "req-1",
      userAgent: "vitest",
    });

    expect(userRepository.findById).toHaveBeenCalledWith("user-1");
    expect(userRepository.saveUserAndOutbox).toHaveBeenCalledTimes(1);
    expect(userRepository.saveUserAndOutbox).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user-1",
      }),
      expect.objectContaining({
        eventName: SECURITY_AUDIT_EVENTS.LOGOUT,
        payload: expect.objectContaining({
          userId: "user-1",
          authzVersion: 2,
          ipAddress: "10.0.0.1",
          requestId: "req-1",
          userAgent: "vitest",
          occurredAt: expect.any(String),
        }),
      })
    );
  });
});

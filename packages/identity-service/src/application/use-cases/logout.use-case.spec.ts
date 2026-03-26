import { describe, it, expect, vi } from "vitest";
import { LogoutUseCase } from "./logout.use-case";
import { SECURITY_AUDIT_EVENTS } from "../security-audit";

describe("LogoutUseCase", () => {
  it("appends logout audit event", async () => {
    const outboxRepository = { append: vi.fn().mockResolvedValue(undefined) };
    const useCase = new LogoutUseCase(outboxRepository as never);

    await useCase.execute("user-1", {
      ipAddress: "10.0.0.1",
      requestId: "req-1",
      userAgent: "vitest",
    });

    expect(outboxRepository.append).toHaveBeenCalledTimes(1);
    expect(outboxRepository.append).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: SECURITY_AUDIT_EVENTS.LOGOUT,
        payload: expect.objectContaining({
          userId: "user-1",
          ipAddress: "10.0.0.1",
          requestId: "req-1",
          userAgent: "vitest",
          occurredAt: expect.any(String),
        }),
      })
    );
  });
});

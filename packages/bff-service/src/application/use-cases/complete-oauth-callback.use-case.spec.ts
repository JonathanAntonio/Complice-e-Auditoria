import { describe, expect, it, vi } from "vitest";
import { CompleteOAuthCallbackUseCase } from "./complete-oauth-callback.use-case";

describe("CompleteOAuthCallbackUseCase", () => {
  it("returns access token from IAM callback response", async () => {
    const iamAuthClient = {
      completeCallback: vi.fn().mockResolvedValue({
        accessToken: "token-123",
      }),
    } as never;
    const useCase = new CompleteOAuthCallbackUseCase(iamAuthClient);

    const token = await useCase.execute("google", "code", "state");

    expect(token).toBe("token-123");
    expect(iamAuthClient.completeCallback).toHaveBeenCalledWith("google", "code", "state");
  });

  it("throws when IAM response has no access token", async () => {
    const iamAuthClient = {
      completeCallback: vi.fn().mockResolvedValue({
        accessToken: "",
      }),
    } as never;
    const useCase = new CompleteOAuthCallbackUseCase(iamAuthClient);

    await expect(useCase.execute("google", "code", "state")).rejects.toThrow(
      "IAM callback did not return a valid access token"
    );
  });
});

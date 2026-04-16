import { describe, expect, it, vi } from "vitest";
import { StartOAuthUseCase } from "./start-oauth.use-case";

describe("StartOAuthUseCase", () => {
  it("asks IAM for authorization url with callback derived from public base url", async () => {
    const iamAuthClient = {
      getAuthorizationUrl: vi.fn().mockResolvedValue("https://oauth.example.com/auth"),
    } as never;
    const useCase = new StartOAuthUseCase(iamAuthClient);

    const result = await useCase.execute("google", "https://app.example.com");

    expect(result).toBe("https://oauth.example.com/auth");
    expect(iamAuthClient.getAuthorizationUrl).toHaveBeenCalledWith(
      "google",
      "https://app.example.com/login/google/callback"
    );
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { IamAuthHttpClient } from "./iam-auth-http.client";
import { UpstreamHttpError } from "../../../application/errors/upstream-http.error";

describe("IamAuthHttpClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests authorization url from IAM", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ url: "https://oauth.example.com/auth" }), { status: 200 })
    );

    const client = new IamAuthHttpClient({
      gatewayBaseUrl: "https://gateway.example.com",
      iamAuthBasePath: "/identity/api/auth",
    });

    const url = await client.getAuthorizationUrl("google", "https://app.example.com/login/google/callback");

    expect(url).toBe("https://oauth.example.com/auth");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("throws UpstreamHttpError on non-2xx responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "bad request" }), { status: 400 })
    );

    const client = new IamAuthHttpClient({
      gatewayBaseUrl: "https://gateway.example.com",
      iamAuthBasePath: "/identity/api/auth",
    });

    await expect(
      client.getCurrentUser("token")
    ).rejects.toBeInstanceOf(UpstreamHttpError);
  });
});

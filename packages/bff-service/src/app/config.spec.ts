import { describe, expect, it } from "vitest";
import { loadBffConfig } from "./config";

describe("loadBffConfig", () => {
  it("loads defaults when env vars are missing", () => {
    const config = loadBffConfig({});

    expect(config.port).toBe(3004);
    expect(config.gatewayBaseUrl).toBe("http://localhost:8080");
    expect(config.iamAuthBasePath).toBe("/identity/api/auth");
    expect(config.explicitPublicBaseUrl).toBeNull();
    expect(config.sessionCookieName).toBe("complice_session");
    expect(config.sessionMaxAgeSeconds).toBe(604800);
  });

  it("normalizes values from env", () => {
    const config = loadBffConfig({
      BFF_PORT: "4000",
      BFF_GATEWAY_URL: "https://gateway.example.com/",
      BFF_IAM_AUTH_BASE_PATH: "identity/api/auth/",
      BFF_PUBLIC_BASE_URL: "https://public.example.com/",
      BFF_SESSION_COOKIE_NAME: " session ",
      BFF_SESSION_MAX_AGE_SECONDS: "123",
    });

    expect(config.port).toBe(4000);
    expect(config.gatewayBaseUrl).toBe("https://gateway.example.com");
    expect(config.iamAuthBasePath).toBe("/identity/api/auth");
    expect(config.explicitPublicBaseUrl).toBe("https://public.example.com");
    expect(config.sessionCookieName).toBe("session");
    expect(config.sessionMaxAgeSeconds).toBe(123);
  });
});

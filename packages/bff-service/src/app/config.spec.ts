import { describe, expect, it } from "vitest";
import { loadBffConfig } from "./config";

describe("loadBffConfig", () => {
  it("loads defaults when env vars are missing", () => {
    const config = loadBffConfig({});

    expect(config.port).toBe(4000);
    expect(config.gatewayBaseUrl).toBe("http://localhost:8080");
    expect(config.iamAuthBasePath).toBe("/identity/api/v1/auth");
    expect(config.complianceBasePath).toBe("/compliance/api/v1");
    expect(config.auditBasePath).toBe("/audit/api/v1");
    expect(config.riskBasePath).toBe("/risk/api/v1");
    expect(config.reportingBasePath).toBe("/reporting/api/v1");
    expect(config.notificationBasePath).toBe("/notification/api/v1");
    expect(config.integrationBasePath).toBe("/integration/api/v1");
    expect(config.integrationApiKey).toBe("");
    expect(config.explicitPublicBaseUrl).toBeNull();
    expect(config.sessionCookieName).toBe("complice_session");
    expect(config.sessionMaxAgeSeconds).toBe(604800);
  });

  it("normalizes values from env", () => {
    const config = loadBffConfig({
      BFF_PORT: "4000",
      BFF_GATEWAY_URL: "https://gateway.example.com/",
      BFF_IAM_AUTH_BASE_PATH: "identity/api/v1/auth/",
      BFF_COMPLIANCE_BASE_PATH: "compliance/api/v1/",
      BFF_AUDIT_BASE_PATH: "audit/api/v1/",
      BFF_RISK_BASE_PATH: "risk/api/v1/",
      BFF_REPORTING_BASE_PATH: "reporting/api/v1/",
      BFF_NOTIFICATION_BASE_PATH: "notification/api/v1/",
      BFF_INTEGRATION_BASE_PATH: "integration/api/v1/",
      BFF_INTEGRATION_API_KEY: " api-key ",
      BFF_PUBLIC_BASE_URL: "https://public.example.com/",
      BFF_SESSION_COOKIE_NAME: " session ",
      BFF_SESSION_MAX_AGE_SECONDS: "123",
    });

    expect(config.port).toBe(4000);
    expect(config.gatewayBaseUrl).toBe("https://gateway.example.com");
    expect(config.iamAuthBasePath).toBe("/identity/api/v1/auth");
    expect(config.complianceBasePath).toBe("/compliance/api/v1");
    expect(config.auditBasePath).toBe("/audit/api/v1");
    expect(config.riskBasePath).toBe("/risk/api/v1");
    expect(config.reportingBasePath).toBe("/reporting/api/v1");
    expect(config.notificationBasePath).toBe("/notification/api/v1");
    expect(config.integrationBasePath).toBe("/integration/api/v1");
    expect(config.integrationApiKey).toBe("api-key");
    expect(config.explicitPublicBaseUrl).toBe("https://public.example.com");
    expect(config.sessionCookieName).toBe("session");
    expect(config.sessionMaxAgeSeconds).toBe(123);
  });
});

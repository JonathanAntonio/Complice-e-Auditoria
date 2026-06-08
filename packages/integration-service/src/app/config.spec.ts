import { describe, expect, it } from "vitest";
import { loadIntegrationServiceConfig } from "./config";

describe("loadIntegrationServiceConfig", () => {
  it("loads dev defaults and provided values", () => {
    const config = loadIntegrationServiceConfig({
      INTEGRATION_API_KEY: "1234567890abcdef",
      INTEGRATION_SERVICE_PORT: "3010",
      OUTBOX_RELAY_INTERVAL_MS: "3500",
      INTEGRATION_BASE_URL: "https://integration.example.com",
      CORS_ORIGIN: "https://app.example.com",
    });

    expect(config.port).toBe(3010);
    expect(config.databaseUrl).toContain("lframework_integration");
    expect(config.rabbitmqUrl).toContain("localhost:5672");
    expect(config.integrationApiKey).toBe("1234567890abcdef");
    expect(config.baseUrl).toBe("https://integration.example.com");
    expect(config.corsOrigin).toBe("https://app.example.com");
    expect(config.outboxRelayIntervalMs).toBe(3500);
    expect(config.complianceBaseUrl).toBe("http://localhost:4002");
    expect(config.riskBaseUrl).toBe("http://localhost:4006");
    expect(config.auditBaseUrl).toBe("http://localhost:4005");
    expect(config.jwtSecret).toBe("change-me-in-production-use-a-long-random-secret");
  });
});

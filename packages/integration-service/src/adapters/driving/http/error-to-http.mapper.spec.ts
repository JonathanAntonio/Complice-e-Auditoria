import { describe, expect, it } from "vitest";
import { mapIntegrationErrorToHttp } from "./error-to-http.mapper";

describe("mapIntegrationErrorToHttp", () => {
  it("maps explicit statusCode and message", () => {
    const result = mapIntegrationErrorToHttp({ statusCode: 404, message: "Not found" });
    expect(result).toEqual({ statusCode: 404, message: "Not found" });
  });

  it("maps zod-like errors to 400", () => {
    const result = mapIntegrationErrorToHttp({ name: "ZodError" });
    expect(result).toEqual({ statusCode: 400, message: "Invalid request payload" });
  });

  it("maps prisma unique conflicts to 409", () => {
    const result = mapIntegrationErrorToHttp({ code: "P2002" });
    expect(result).toEqual({ statusCode: 409, message: "Conflict" });
  });

  it("falls back to 500 on unknown errors", () => {
    const result = mapIntegrationErrorToHttp(new Error("boom"));
    expect(result).toEqual({ statusCode: 500, message: "Internal server error" });
  });
});

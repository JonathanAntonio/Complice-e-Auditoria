import { describe, expect, it } from "vitest";
import { resolvePublicBaseUrl, shouldUseSecureCookie } from "./public-base-url.resolver";

describe("public-base-url.resolver", () => {
  it("returns explicit public base url when configured", () => {
    const req = {
      headers: {},
      protocol: "http",
      get: () => "localhost:5173",
      secure: false,
    } as never;

    expect(resolvePublicBaseUrl(req, "https://public.example.com")).toBe("https://public.example.com");
  });

  it("builds url from forwarded headers", () => {
    const req = {
      headers: {
        "x-forwarded-proto": "https",
        "x-forwarded-host": "app.example.com",
      },
      protocol: "http",
      get: () => "localhost:5173",
      secure: false,
    } as never;

    expect(resolvePublicBaseUrl(req, null)).toBe("https://app.example.com");
    expect(shouldUseSecureCookie(req, null)).toBe(true);
  });

  it("does not force secure cookie on localhost host even with explicit https base url", () => {
    const req = {
      headers: {},
      protocol: "http",
      get: () => "localhost:5173",
      secure: false,
    } as never;

    expect(shouldUseSecureCookie(req, "https://app.example.com")).toBe(false);
  });

  it("falls back to req.secure when url cannot be resolved", () => {
    const req = {
      headers: {},
      protocol: "",
      get: () => undefined,
      secure: true,
    } as never;

    expect(resolvePublicBaseUrl(req, null)).toBeNull();
    expect(shouldUseSecureCookie(req, null)).toBe(true);
  });
});

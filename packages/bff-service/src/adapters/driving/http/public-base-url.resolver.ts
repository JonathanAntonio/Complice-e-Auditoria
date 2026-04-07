import type { Request } from "express";

export function resolvePublicBaseUrl(req: Request, explicitPublicBaseUrl: string | null): string | null {
  if (explicitPublicBaseUrl) return explicitPublicBaseUrl;
  const forwardedProto = firstForwardedValue(req.headers["x-forwarded-proto"]);
  const forwardedHost = firstForwardedValue(req.headers["x-forwarded-host"]);
  const protocol = forwardedProto ?? req.protocol;
  const host = forwardedHost ?? req.get("host");
  if (!protocol || !host) return null;
  return normalizeBaseUrl(`${protocol}://${host}`);
}

export function shouldUseSecureCookie(req: Request, explicitPublicBaseUrl: string | null): boolean {
  const publicBaseUrl = resolvePublicBaseUrl(req, explicitPublicBaseUrl);
  if (publicBaseUrl) return isHttpsUrl(publicBaseUrl);
  return req.secure;
}

function firstForwardedValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return firstForwardedValue(value[0]);
  }
  if (typeof value !== "string") return undefined;
  const first = value.split(",")[0]?.trim();
  return first && first.length > 0 ? first : undefined;
}

function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeBaseUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl);
  parsed.hash = "";
  parsed.search = "";
  return parsed.toString().replace(/\/$/, "");
}

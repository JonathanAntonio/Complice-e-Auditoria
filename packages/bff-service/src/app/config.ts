export interface BffConfig {
  port: number;
  gatewayBaseUrl: string;
  iamAuthBasePath: string;
  complianceBasePath: string;
  auditBasePath: string;
  riskBasePath: string;
  messagingBasePath: string;
  reportingBasePath: string;
  notificationBasePath: string;
  integrationBasePath: string;
  integrationApiKey: string;
  explicitPublicBaseUrl: string | null;
  sessionCookieName: string;
  sessionMaxAgeSeconds: number;
}

export function loadBffConfig(env: NodeJS.ProcessEnv): BffConfig {
  return {
    port: parsePort(env.BFF_PORT, 4000),
    gatewayBaseUrl: normalizeBaseUrl(env.BFF_GATEWAY_URL ?? "http://localhost:8080"),
    iamAuthBasePath: normalizeBasePath(env.BFF_IAM_AUTH_BASE_PATH ?? "/identity/api/v1/auth"),
    complianceBasePath: normalizeBasePath(env.BFF_COMPLIANCE_BASE_PATH ?? "/compliance/api/v1"),
    auditBasePath: normalizeBasePath(env.BFF_AUDIT_BASE_PATH ?? "/audit/api/v1"),
    riskBasePath: normalizeBasePath(env.BFF_RISK_BASE_PATH ?? "/risk/api/v1"),
    messagingBasePath: normalizeBasePath(env.BFF_MESSAGING_BASE_PATH ?? "/messaging/api/v1"),
    reportingBasePath: normalizeBasePath(env.BFF_REPORTING_BASE_PATH ?? "/reporting/api/v1"),
    notificationBasePath: normalizeBasePath(env.BFF_NOTIFICATION_BASE_PATH ?? "/notification/api/v1"),
    integrationBasePath: normalizeBasePath(env.BFF_INTEGRATION_BASE_PATH ?? "/integration/api/v1"),
    integrationApiKey: (env.BFF_INTEGRATION_API_KEY ?? "").trim(),
    explicitPublicBaseUrl: normalizeOptionalUrl(env.BFF_PUBLIC_BASE_URL),
    sessionCookieName: (env.BFF_SESSION_COOKIE_NAME ?? "complice_session").trim() || "complice_session",
    sessionMaxAgeSeconds: parsePositiveInt(env.BFF_SESSION_MAX_AGE_SECONDS, 604800),
  };
}

function normalizeBaseUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl);
  parsed.hash = "";
  parsed.search = "";
  return parsed.toString().replace(/\/$/, "");
}

function normalizeOptionalUrl(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  return normalizeBaseUrl(trimmed);
}

function normalizeBasePath(pathValue: string): string {
  const trimmed = pathValue.trim();
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}

function parsePort(rawPort: string | undefined, fallback: number): number {
  const parsed = parseInt(rawPort ?? `${fallback}`, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) return fallback;
  return parsed;
}

function parsePositiveInt(rawValue: string | undefined, fallback: number): number {
  const parsed = parseInt(rawValue ?? `${fallback}`, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

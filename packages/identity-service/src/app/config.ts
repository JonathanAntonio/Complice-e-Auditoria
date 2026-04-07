import { logger } from "@lframework/shared";

export interface IdentityServiceConfig {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  rabbitmqUrl: string;
  jwtSecret: string;
  jwtExpiresInSeconds: number;
  baseUrl: string;
  corsOrigin?: string;
  googleOAuth?: { clientId: string; clientSecret: string };
  githubOAuth?: { clientId: string; clientSecret: string };
  outboxRelayIntervalMs: number;
}

export function loadIdentityServiceConfig(env: NodeJS.ProcessEnv): IdentityServiceConfig {
  const port = parseInt(env.IDENTITY_SERVICE_PORT ?? "3001", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    logger.error("IDENTITY_SERVICE_PORT must be a valid port (1-65535)");
    process.exit(1);
  }
  const isProduction = env.NODE_ENV === "production";

  if (isProduction && !env.IDENTITY_DATABASE_URL) {
    logger.error("IDENTITY_DATABASE_URL must be set in production");
    process.exit(1);
  }
  if (isProduction && !env.REDIS_URL) {
    logger.error("REDIS_URL must be set in production");
    process.exit(1);
  }
  if (isProduction && !env.RABBITMQ_URL) {
    logger.error("RABBITMQ_URL must be set in production");
    process.exit(1);
  }

  const databaseUrl = isProduction
    ? env.IDENTITY_DATABASE_URL!
    : (env.IDENTITY_DATABASE_URL ?? "postgresql://lframework:lframework@localhost:5432/lframework_identity");
  const redisUrl = isProduction
    ? env.REDIS_URL!
    : (env.REDIS_URL ?? "redis://localhost:6379");
  const rabbitmqUrl = isProduction
    ? env.RABBITMQ_URL!
    : (env.RABBITMQ_URL ?? "amqp://lframework:lframework@localhost:5672");
  const jwtSecret = env.JWT_SECRET ?? (isProduction ? "" : "dev-secret-min-32-chars-for-jwt-signing");
  const jwtExpiresInSeconds = parseInt(env.JWT_EXPIRES_IN_SECONDS ?? "604800", 10);
  if (!Number.isInteger(jwtExpiresInSeconds) || jwtExpiresInSeconds < 1) {
    logger.error("JWT_EXPIRES_IN_SECONDS must be a positive integer");
    process.exit(1);
  }
  const baseUrl = env.BASE_URL ?? `http://localhost:${port}`;
  const disallowLocalhostRedirects = env.ALLOW_LOCALHOST_REDIRECTS !== "true";

  if (isProduction && (!jwtSecret || jwtSecret.length < 32)) {
    logger.error("JWT_SECRET must be set and at least 32 characters in production");
    process.exit(1);
  }
  if (disallowLocalhostRedirects && isLocalhostUrl(baseUrl)) {
    logger.error({ baseUrl }, "BASE_URL points to localhost and localhost redirects are disabled");
    process.exit(1);
  }

  const googleOAuth = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
    : undefined;
  const githubOAuth = env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    ? { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET }
    : undefined;

  const outboxRelayIntervalRaw = parseInt(env.OUTBOX_RELAY_INTERVAL_MS ?? "2000", 10);
  const outboxRelayIntervalMs =
    Number.isInteger(outboxRelayIntervalRaw) && outboxRelayIntervalRaw > 0
      ? outboxRelayIntervalRaw
      : 2000;

  logger.info(
    {
      baseUrl,
      googleOAuthConfigured: Boolean(googleOAuth),
      githubOAuthConfigured: Boolean(githubOAuth),
    },
    "Identity auth configuration"
  );

  return {
    port,
    databaseUrl,
    redisUrl,
    rabbitmqUrl,
    jwtSecret,
    jwtExpiresInSeconds,
    baseUrl,
    corsOrigin: env.CORS_ORIGIN,
    googleOAuth,
    githubOAuth,
    outboxRelayIntervalMs,
  };
}

function isLocalhostUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

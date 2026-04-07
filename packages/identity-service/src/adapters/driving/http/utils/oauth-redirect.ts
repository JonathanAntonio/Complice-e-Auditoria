import { randomBytes } from "crypto";
import type { IOAuthProvider } from "../../../../application/ports/oauth-provider.port";
import type { ICacheService } from "@lframework/shared";

const OAUTH_STATE_TTL_SECONDS = 600; // 10 min
export const OAUTH_STATE_PREFIX = "oauth_state:";

/**
 * Gera state aleatório, grava no cache e retorna URL de autorização do provedor.
 */
export async function createOAuthAuthorizationUrl(
  provider: IOAuthProvider,
  basePath: string,
  cache: ICacheService,
  baseUrl: string,
  redirectUriOverride?: string
): Promise<string> {
  const state = randomBytes(16).toString("hex");
  const redirectUri = redirectUriOverride ?? `${baseUrl}/api/auth/${basePath}/callback`;
  await cache.set(OAUTH_STATE_PREFIX + state, { redirectUri }, OAUTH_STATE_TTL_SECONDS);
  return provider.getAuthorizationUrl(redirectUri, state);
}

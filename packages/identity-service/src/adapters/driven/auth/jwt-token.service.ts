import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { z } from "zod";
import type { ITokenService, TokenPayload } from "../../../application/ports";
import { logger } from "@lframework/shared";
import { DEFAULT_USER_ROLE } from "../../../domain/types";

/** Schema para validar o payload do JWT após decode (exp/iat vindos do jsonwebtoken). */
const jwtPayloadSchema = z.object({
  sub: z.string().min(1),
  email: z.string().optional(),
  primaryRole: z.string().optional(),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  permissionsHash: z.string().optional(),
  authzVersion: z.number().int().positive().optional(),
  exp: z.number(),
  iat: z.number(),
});

export interface JwtTokenServiceConfig {
  secret: string;
  expiresInSeconds: number;
}

/**
 * Adapter: implementação de ITokenService com JWT.
 */
export class JwtTokenService implements ITokenService {
  constructor(private readonly config: JwtTokenServiceConfig) {}

  sign(payload: Omit<TokenPayload, "iat" | "exp">): string {
    const { sub, email, primaryRole, roles, permissions, authzVersion } = payload;
    const resolvedPrimaryRole = primaryRole ?? DEFAULT_USER_ROLE;
    const resolvedRoles = [...(roles ?? [resolvedPrimaryRole])];
    if (!resolvedRoles.includes(resolvedPrimaryRole)) {
      resolvedRoles.push(resolvedPrimaryRole);
    }
    const resolvedPermissions = permissions ?? [];
    const permissionsHash =
      resolvedPermissions.length > 0
        ? createHash("sha256").update([...resolvedPermissions].sort().join(",")).digest("hex")
        : undefined;

    return jwt.sign(
      {
        sub,
        email,
        primaryRole: resolvedPrimaryRole,
        roles: resolvedRoles,
        permissions: resolvedPermissions,
        permissionsHash,
        authzVersion: authzVersion ?? 1,
      },
      this.config.secret,
      { expiresIn: this.config.expiresInSeconds, algorithm: "HS256" }
    );
  }

  verify(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.config.secret, {
        algorithms: ["HS256"],
      });
      const result = jwtPayloadSchema.safeParse(decoded);
      if (!result.success) {
        logger.debug({ err: result.error.flatten() }, "JWT payload validation failed");
        return null;
      }
      const data = result.data;
      const resolvedPrimaryRole = data.primaryRole ?? DEFAULT_USER_ROLE;
      const resolvedRoles = [...(data.roles ?? [resolvedPrimaryRole])];
      if (!resolvedRoles.includes(resolvedPrimaryRole)) {
        resolvedRoles.push(resolvedPrimaryRole);
      }
      return {
        sub: data.sub,
        email: data.email ?? "",
        primaryRole: resolvedPrimaryRole,
        roles: resolvedRoles,
        permissions: data.permissions ?? [],
        authzVersion: data.authzVersion ?? 1,
        iat: data.iat,
        exp: data.exp,
        ...(data.permissionsHash ? { permissionsHash: data.permissionsHash } : {}),
      };
    } catch (err) {
      logger.debug({ err }, "JWT verify failed");
      return null;
    }
  }
}

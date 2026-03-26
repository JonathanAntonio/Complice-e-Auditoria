/**
 * Porta: serviço de tokens JWT.
 * Assinar e verificar tokens sem depender de implementação.
 * Keep JWT claims compact: roles should stay small (prefer <= 8) and avoid large permission arrays.
 */
export interface TokenPayload {
  sub: string;   // userId
  email: string;
  primaryRole: string;
  roles: string[];
  /** Full permission claims are currently kept for compatibility; use permissionsHash for compact checks. */
  permissions: string[];
  permissionsHash?: string;
  authzVersion: number;
  iat?: number;
  exp?: number;
}

export interface ITokenService {
  sign(payload: Omit<TokenPayload, "iat" | "exp">): string;
  verify(token: string): TokenPayload | null;
}

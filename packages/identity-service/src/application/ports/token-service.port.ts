/**
 * Porta: serviço de tokens JWT.
 * Assinar e verificar tokens sem depender de implementação.
 */
export interface TokenPayload {
  sub: string;   // userId
  email: string;
  primaryRole: string;
  permissions: string[];
  authzVersion: number;
  iat?: number;
  exp?: number;
}

export interface ITokenService {
  sign(payload: Omit<TokenPayload, "iat" | "exp">): string;
  verify(token: string): TokenPayload | null;
}

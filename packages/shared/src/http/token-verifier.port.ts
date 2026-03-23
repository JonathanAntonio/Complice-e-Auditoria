/**
 * Payload mínimo retornado pela verificação do token (sub = userId).
 * Compatível com JwtPayload do createAuthMiddleware.
 */
export interface TokenVerifierPayload {
  sub: string;
  email?: string;
  primaryRole?: string;
  permissions?: string[];
  authzVersion?: number;
}

/**
 * Porta: verificação de token JWT (apenas verify).
 * Permite que serviços consumidores (ex.: catalog) verifiquem tokens sem depender de implementação.
 */
export interface ITokenVerifier {
  verify(token: string): TokenVerifierPayload | null;
}

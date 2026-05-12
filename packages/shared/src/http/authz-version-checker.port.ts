/**
 * Interface para verificar a versão de autorização de um usuário.
 * Usada no middleware de autenticação para invalidar tokens cujo payload
 * contenha uma versão inferior à versão atual registrada no sistema.
 */
export interface IAuthzVersionChecker {
  /**
   * Retorna a versão de autorização atual para o usuário.
   * Se não houver versão registrada (cache miss), pode retornar null para indicar
   * que a validação deve ser ignorada ou processada de outra forma.
   */
  getLatestVersion(userId: string): Promise<number | null>;

  /**
   * Registra/Atualiza a versão de autorização atual para o usuário.
   * Geralmente chamada pelo identity-service após mutações de papel/status.
   */
  updateVersion(userId: string, version: number): Promise<void>;
}

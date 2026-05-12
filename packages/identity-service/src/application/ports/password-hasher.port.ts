/**
 * Porta para o serviço de hashing de senhas.
 */
export interface IPasswordHasher {
  /**
   * Gera um hash a partir de uma senha em texto plano.
   */
  hash(password: string): Promise<string>;

  /**
   * Compara uma senha em texto plano com um hash.
   */
  compare(password: string, hash: string): Promise<boolean>;
}

/**
 * Perfil de usuário retornado em respostas de autenticação OAuth.
 */
export interface UserAuthProfileDto {
  id: string;
  email: string;
  name: string;
  primaryRole: string;
  roles: string[];
  permissions: string[];
  authzVersion: number;
  isActive: boolean;
  createdAt?: string;
  isNewUser?: boolean;
}

/**
 * User subset in auth responses (login pode omitir createdAt).
 */
export interface AuthUserDto {
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

export interface AuthResponseDto {
  user: AuthUserDto;
  accessToken: string;
  expiresIn: string;
}

import type { OAuthAuthResponse, OAuthProvider } from "../../domain/oauth";
import type {
  AdminCreateUserInputDto,
  AdminUpdateUserRolesInputDto,
  AdminUpdateUserSecurityInputDto,
  AdminUsersListDto,
  AdminUsersQueryDto,
  AdminUserDto,
} from "../dtos/admin-user.dto";
import type { LoginInputDto, RegisterInputDto, AuthResponseDto } from "../dtos/auth.dto";

export interface IIamAuthClient {
  getAuthorizationUrl(provider: OAuthProvider, redirectUri: string): Promise<string>;
  completeCallback(provider: OAuthProvider, code: string, state: string): Promise<OAuthAuthResponse>;
  login(input: LoginInputDto): Promise<AuthResponseDto>;
  register(input: RegisterInputDto): Promise<AuthResponseDto>;
  getCurrentUser(token: string): Promise<unknown>;
  logout(token: string): Promise<void>;
  listUsers(token: string, query: AdminUsersQueryDto): Promise<AdminUsersListDto>;
  getUserById(token: string, userId: string): Promise<AdminUserDto>;
  createUser(token: string, input: AdminCreateUserInputDto): Promise<AdminUserDto>;
  updateUserRoles(token: string, userId: string, input: AdminUpdateUserRolesInputDto): Promise<AdminUserDto>;
  updateUserSecurity(token: string, userId: string, input: AdminUpdateUserSecurityInputDto): Promise<AdminUserDto>;
  deactivateUser(token: string, userId: string): Promise<AdminUserDto>;
}

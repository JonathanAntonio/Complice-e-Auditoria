import type { OAuthAuthResponse, OAuthProvider } from "../../domain/oauth";

export interface IIamAuthClient {
  getAuthorizationUrl(provider: OAuthProvider, redirectUri: string): Promise<string>;
  completeCallback(provider: OAuthProvider, code: string, state: string): Promise<OAuthAuthResponse>;
  getCurrentUser(token: string): Promise<unknown>;
  logout(token: string): Promise<void>;
}

export type OAuthProvider = "google" | "github";

export interface OAuthAuthResponse {
  accessToken: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    name: string;
    primaryRole: string;
    roles: string[];
    permissions: string[];
  };
}

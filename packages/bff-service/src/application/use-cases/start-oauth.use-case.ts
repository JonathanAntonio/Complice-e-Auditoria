import type { IIamAuthClient } from "../ports/iam-auth-client.port";
import type { OAuthProvider } from "../../domain/oauth";

export class StartOAuthUseCase {
  constructor(private readonly iamAuthClient: IIamAuthClient) {}

  async execute(provider: OAuthProvider, publicBaseUrl: string): Promise<string> {
    const callbackUri = `${publicBaseUrl}/bff/auth/${provider}/callback`;
    return this.iamAuthClient.getAuthorizationUrl(provider, callbackUri);
  }
}

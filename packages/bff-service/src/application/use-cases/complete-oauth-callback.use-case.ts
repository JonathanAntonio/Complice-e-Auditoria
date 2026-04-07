import type { IIamAuthClient } from "../ports/iam-auth-client.port";
import type { OAuthProvider } from "../../domain/oauth";

export class CompleteOAuthCallbackUseCase {
  constructor(private readonly iamAuthClient: IIamAuthClient) {}

  async execute(provider: OAuthProvider, code: string, state: string): Promise<string> {
    const payload = await this.iamAuthClient.completeCallback(provider, code, state);
    if (typeof payload.accessToken !== "string" || payload.accessToken.length === 0) {
      throw new Error("IAM callback did not return a valid access token");
    }
    return payload.accessToken;
  }
}

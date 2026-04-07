import type { IIamAuthClient } from "../ports/iam-auth-client.port";

export class LogoutUseCase {
  constructor(private readonly iamAuthClient: IIamAuthClient) {}

  async execute(token: string): Promise<void> {
    await this.iamAuthClient.logout(token);
  }
}

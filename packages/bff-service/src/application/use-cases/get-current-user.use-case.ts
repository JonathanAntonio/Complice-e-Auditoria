import type { IIamAuthClient } from "../ports/iam-auth-client.port";

export class GetCurrentUserUseCase {
  constructor(private readonly iamAuthClient: IIamAuthClient) {}

  async execute(token: string): Promise<unknown> {
    return this.iamAuthClient.getCurrentUser(token);
  }
}

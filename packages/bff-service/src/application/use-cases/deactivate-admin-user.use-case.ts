import type { IIamAuthClient } from "../ports/iam-auth-client.port";

export class DeactivateAdminUserUseCase {
  constructor(private readonly iamAuthClient: IIamAuthClient) {}

  async execute(token: string, userId: string) {
    return this.iamAuthClient.deactivateUser(token, userId);
  }
}

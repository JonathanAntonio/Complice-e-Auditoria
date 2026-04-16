import type { IIamAuthClient } from "../ports/iam-auth-client.port";

export class GetAdminUserUseCase {
  constructor(private readonly client: IIamAuthClient) {}

  async execute(token: string, userId: string) {
    return this.client.getUserById(token, userId);
  }
}

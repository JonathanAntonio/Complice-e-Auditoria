import type { AdminCreateUserInputDto } from "../dtos/admin-user.dto";
import type { IIamAuthClient } from "../ports/iam-auth-client.port";

export class CreateAdminUserUseCase {
  constructor(private readonly iamAuthClient: IIamAuthClient) {}

  async execute(token: string, input: AdminCreateUserInputDto) {
    return this.iamAuthClient.createUser(token, input);
  }
}

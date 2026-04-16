import type { AdminUpdateUserRolesInputDto } from "../dtos/admin-user.dto";
import type { IIamAuthClient } from "../ports/iam-auth-client.port";

export class UpdateAdminUserRolesUseCase {
  constructor(private readonly iamAuthClient: IIamAuthClient) {}

  async execute(token: string, userId: string, input: AdminUpdateUserRolesInputDto) {
    return this.iamAuthClient.updateUserRoles(token, userId, input);
  }
}

import type { AdminUpdateUserSecurityInputDto } from "../dtos/admin-user.dto";
import type { IIamAuthClient } from "../ports/iam-auth-client.port";

export class UpdateAdminUserSecurityUseCase {
  constructor(private readonly iamAuthClient: IIamAuthClient) {}

  async execute(token: string, userId: string, input: AdminUpdateUserSecurityInputDto) {
    return this.iamAuthClient.updateUserSecurity(token, userId, input);
  }
}

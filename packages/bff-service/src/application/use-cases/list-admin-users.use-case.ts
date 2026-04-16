import type { IIamAuthClient } from "../ports/iam-auth-client.port";
import type { AdminUsersQueryDto } from "../dtos/admin-user.dto";

export class ListAdminUsersUseCase {
  constructor(private readonly iamAuthClient: IIamAuthClient) {}

  async execute(token: string, query: AdminUsersQueryDto) {
    return this.iamAuthClient.listUsers(token, query);
  }
}

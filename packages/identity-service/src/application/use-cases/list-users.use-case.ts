import type { IUserRepository } from "../ports/user-repository.port";
import type { ListUsersQueryDto } from "../dtos/list-users-query.dto";
import type { UserListResponseDto } from "../dtos/list-users-response.dto";
import { toUserResponseDto } from "../dtos/user-profile.mapper";

export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(query: ListUsersQueryDto): Promise<UserListResponseDto> {
    if (!this.userRepository.list) {
      throw new Error("User list repository operation is not available");
    }
    const result = await this.userRepository.list(query);
    return {
      items: result.items.map(toUserResponseDto),
      page: query.page,
      pageSize: query.pageSize,
      total: result.total,
    };
  }
}

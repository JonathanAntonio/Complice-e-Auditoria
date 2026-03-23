import type { IUserRepository } from "../ports/user-repository.port";
import type { UserResponseDto } from "../dtos/user-response.dto";
import { toUserResponseDto } from "../dtos/user-profile.mapper";

export class GetCurrentUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) return null;
    return toUserResponseDto(user);
  }
}

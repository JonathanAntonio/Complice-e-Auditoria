import type { IUserRepository } from "../ports/user-repository.port";
import type { UserResponseDto } from "../dtos/user-response.dto";
import { toUserResponseDto } from "../dtos/user-profile.mapper";
import { InvalidSessionError } from "../errors";

export class GetCurrentUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, authzVersion?: number): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) return null;
    if (typeof authzVersion === "number" && authzVersion !== user.authorizationVersion) {
      throw new InvalidSessionError("Session version mismatch");
    }
    return toUserResponseDto(user);
  }
}

import { randomUUID } from "crypto";
import { User } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-objects/email.vo";
import { USER_CREATED_EVENT } from "@lframework/shared";
import type { IUserRepository } from "../ports/user-repository.port";
import type { IUserCreatedNotifier } from "../ports/user-created-notifier.port";
import type { IPasswordHasher } from "../ports/password-hasher.port";
import type { CreateUserDto } from "../dtos/create-user.dto";
import type { UserResponseDto } from "../dtos/user-response.dto";
import { UserAlreadyExistsError, InvalidEmailError } from "../errors";
import { DEFAULT_USER_ROLE, USER_ROLES, USER_ROLE_VALUES, type UserRole } from "../../domain/types";
import { toUserResponseDto } from "../dtos/user-profile.mapper";

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userCreatedNotifier: IUserCreatedNotifier,
    private readonly passwordHasher?: IPasswordHasher
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    let email: Email;
    try {
      email = Email.create(dto.email);
    } catch {
      throw new InvalidEmailError("Invalid email");
    }
    const existing = await this.userRepository.findByEmail(email.value);
    if (existing) {
      throw new UserAlreadyExistsError("User with this email already exists");
    }

    let passwordHash: string | null = null;
    if (dto.password && this.passwordHasher) {
      passwordHash = await this.passwordHasher.hash(dto.password);
    }

    const { primaryRole, roles } = await this.resolveInitialAccessProfile();
    const id = randomUUID();
    const user = User.create(id, email, dto.name, primaryRole, roles, passwordHash);
    await this.userRepository.saveUserAndOutbox(user, {
      eventName: USER_CREATED_EVENT,
      producer: "identity-service",
      payload: {
        userId: user.id,
        email: user.email.value,
        name: user.name,
        occurredAt: user.createdAt.toISOString(),
      },
    });

    await this.userCreatedNotifier.notify({
      id: user.id,
      email: user.email.value,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    });

    return toUserResponseDto(user);
  }

  private async resolveInitialAccessProfile(): Promise<{ primaryRole: UserRole; roles: UserRole[] }> {
    const totalUsers = this.userRepository.countUsers
      ? await this.userRepository.countUsers()
      : 1;

    if (totalUsers === 0) {
      return {
        primaryRole: USER_ROLES.ADMINISTRADOR,
        roles: [...USER_ROLE_VALUES],
      };
    }

    return {
      primaryRole: DEFAULT_USER_ROLE,
      roles: [DEFAULT_USER_ROLE],
    };
  }
}

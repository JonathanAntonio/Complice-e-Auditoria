import type { UserAuthProfileDto } from "./user-auth-profile.dto";

export interface OAuthCallbackResponseDto {
  user: UserAuthProfileDto;
  accessToken: string;
  expiresIn: string;
}

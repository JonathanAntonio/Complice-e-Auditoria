import type { AuthUserDto } from "./auth-response.dto";

export interface OAuthCallbackResponseDto {
  user: AuthUserDto;
  accessToken: string;
  expiresIn: string;
}

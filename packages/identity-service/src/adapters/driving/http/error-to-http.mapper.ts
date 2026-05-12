import { createErrorToHttpMapper } from "@lframework/shared";
import {
  AccountLockedError,
  UserAlreadyExistsError,
  OAuthAuthenticationError,
  InvalidEmailError,
  UserInactiveError,
  AuthorizationError,
  InvalidSessionError,
  InvalidCredentialsError,
} from "../../../application/errors";

/**
 * Mapeia erros de aplicação/domínio para resposta HTTP (status + mensagem).
 * Centraliza as regras em um único lugar (SRP); controllers só orquestram.
 */
export const mapApplicationErrorToHttp = createErrorToHttpMapper([
  [UserAlreadyExistsError, 409],
  [OAuthAuthenticationError, 401],
  [AccountLockedError, 423],
  [UserInactiveError, 403],
  [InvalidEmailError, 400],
  [InvalidSessionError, 401],
  [AuthorizationError, 403],
  [InvalidCredentialsError, 401],
]);

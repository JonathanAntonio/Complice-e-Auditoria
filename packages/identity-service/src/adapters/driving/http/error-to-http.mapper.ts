import { createErrorToHttpMapper } from "@lframework/shared";
import {
  AccountLockedError,
  UserAlreadyExistsError,
  InvalidCredentialsError,
  InvalidEmailError,
  PasswordValidationError,
  UserInactiveError,
  AuthorizationError,
} from "../../../application/errors";

/**
 * Mapeia erros de aplicação/domínio para resposta HTTP (status + mensagem).
 * Centraliza as regras em um único lugar (SRP); controllers só orquestram.
 */
export const mapApplicationErrorToHttp = createErrorToHttpMapper([
  [UserAlreadyExistsError, 409],
  [InvalidCredentialsError, 401],
  [AccountLockedError, 423],
  [UserInactiveError, 403],
  [InvalidEmailError, 400],
  [PasswordValidationError, 400],
  [AuthorizationError, 403],
]);

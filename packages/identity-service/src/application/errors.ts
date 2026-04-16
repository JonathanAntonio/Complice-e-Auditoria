/**
 * Application/domain errors for identity service.
 * Extend AppError from shared so instanceof and serialization work consistently.
 */

import { AppError } from "@lframework/shared";

export class UserAlreadyExistsError extends AppError {
  override name = "UserAlreadyExistsError";
  constructor(message = "User with this email already exists") {
    super(message);
    Object.setPrototypeOf(this, UserAlreadyExistsError.prototype);
  }
}

export class OAuthAuthenticationError extends AppError {
  override name = "OAuthAuthenticationError";
  constructor(message = "OAuth authentication failed") {
    super(message);
    Object.setPrototypeOf(this, OAuthAuthenticationError.prototype);
  }
}

export class InvalidEmailError extends AppError {
  override name = "InvalidEmailError";
  constructor(message = "Invalid email") {
    super(message);
    Object.setPrototypeOf(this, InvalidEmailError.prototype);
  }
}

export class AccountLockedError extends AppError {
  override name = "AccountLockedError";
  constructor(message = "Account is temporarily locked due to failed authentication attempts") {
    super(message);
    Object.setPrototypeOf(this, AccountLockedError.prototype);
  }
}

export class UserInactiveError extends AppError {
  override name = "UserInactiveError";
  constructor(message = "User is inactive") {
    super(message);
    Object.setPrototypeOf(this, UserInactiveError.prototype);
  }
}

export class AuthorizationError extends AppError {
  override name = "AuthorizationError";
  constructor(message = "Forbidden") {
    super(message);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class InvalidSessionError extends AppError {
  override name = "InvalidSessionError";
  constructor(message = "Invalid session") {
    super(message);
    Object.setPrototypeOf(this, InvalidSessionError.prototype);
  }
}

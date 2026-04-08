/**
 * Application/domain errors for compliance service.
 * Extend AppError from shared so instanceof and serialization work consistently.
 */

import { AppError } from "@lframework/shared";

export class InvalidItemError extends AppError {
  override name = "InvalidItemError";
  constructor(message = "Invalid item") {
    super(message);
    Object.setPrototypeOf(this, InvalidItemError.prototype);
  }
}

export class ItemNotFoundError extends AppError {
  override name = "ItemNotFoundError";
  constructor(message = "Item not found") {
    super(message);
    Object.setPrototypeOf(this, ItemNotFoundError.prototype);
  }
}

import { Email } from "../value-objects/email.vo";
import { DEFAULT_USER_ROLE, type UserRole } from "../types";

/**
 * Entidade de domínio: User.
 * Identidade: id. Regras de negócio no domínio.
 */
export class User {
  private constructor(
    private readonly _id: string,
    private _email: Email,
    private _name: string,
    private _role: UserRole,
    private _isActive: boolean,
    private _failedLoginAttempts: number,
    private _blockedUntil: Date | null,
    private readonly _createdAt: Date
  ) {}

  static create(
    id: string,
    email: Email,
    name: string,
    role: UserRole = DEFAULT_USER_ROLE
  ): User {
    if (!name || name.trim().length === 0) {
      throw new Error("Name is required");
    }
    return new User(id, email, name.trim(), role, true, 0, null, new Date());
  }

  static reconstitute(
    id: string,
    email: string,
    name: string,
    createdAt: Date,
    role: UserRole = DEFAULT_USER_ROLE,
    isActive: boolean = true,
    failedLoginAttempts: number = 0,
    blockedUntil: Date | null = null
  ): User {
    return new User(
      id,
      Email.create(email),
      name,
      role,
      isActive,
      failedLoginAttempts,
      blockedUntil,
      createdAt
    );
  }

  get id(): string {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get role(): UserRole {
    return this._role;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get failedLoginAttempts(): number {
    return this._failedLoginAttempts;
  }

  get blockedUntil(): Date | null {
    return this._blockedUntil ? new Date(this._blockedUntil.getTime()) : null;
  }

  get createdAt(): Date {
    return new Date(this._createdAt.getTime());
  }

  isBlocked(at: Date): boolean {
    return this._blockedUntil !== null && this._blockedUntil.getTime() > at.getTime();
  }

  markInactive(): void {
    this._isActive = false;
  }

  recordSuccessfulLogin(): void {
    this._failedLoginAttempts = 0;
    this._blockedUntil = null;
  }

  recordFailedLogin(at: Date, maxAttempts: number, lockDurationMs: number): void {
    if (this._blockedUntil !== null && at.getTime() < this._blockedUntil.getTime()) {
      return;
    }

    this._failedLoginAttempts += 1;
    if (this._failedLoginAttempts >= maxAttempts) {
      this._blockedUntil = new Date(at.getTime() + lockDurationMs);
    }
  }
}

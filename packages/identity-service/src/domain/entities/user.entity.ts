import { Email } from "../value-objects/email.vo";
import {
  DEFAULT_USER_ROLE,
  permissionsForRole,
  type Permission,
  type UserRole,
} from "../types";

/**
 * Entidade de domínio: User.
 * Identidade: id. Regras de negócio no domínio.
 */
export class User {
  private constructor(
    private readonly _id: string,
    private _email: Email,
    private _name: string,
    private _primaryRole: UserRole,
    private _permissions: Permission[],
    private _authorizationVersion: number,
    private _isActive: boolean,
    private _failedLoginAttempts: number,
    private _blockedUntil: Date | null,
    private readonly _createdAt: Date
  ) {}

  static create(
    id: string,
    email: Email,
    name: string,
    primaryRole: UserRole = DEFAULT_USER_ROLE
  ): User {
    if (!name || name.trim().length === 0) {
      throw new Error("Name is required");
    }
    return new User(
      id,
      email,
      name.trim(),
      primaryRole,
      permissionsForRole(primaryRole),
      1,
      true,
      0,
      null,
      new Date()
    );
  }

  static reconstitute(
    id: string,
    email: string,
    name: string,
    createdAt: Date,
    primaryRole: UserRole = DEFAULT_USER_ROLE,
    permissionsOrIsActive: Permission[] | boolean = permissionsForRole(primaryRole),
    authorizationVersionOrFailedLoginAttempts: number = 1,
    isActiveOrBlockedUntil: boolean | Date | null = true,
    failedLoginAttempts = 0,
    blockedUntil: Date | null = null
  ): User {
    let permissions: Permission[];
    let authorizationVersion: number;
    let isActive: boolean;

    if (Array.isArray(permissionsOrIsActive)) {
      permissions = permissionsOrIsActive;
      authorizationVersion = authorizationVersionOrFailedLoginAttempts;
      isActive = typeof isActiveOrBlockedUntil === "boolean" ? isActiveOrBlockedUntil : true;
    } else {
      permissions = permissionsForRole(primaryRole);
      authorizationVersion = 1;
      isActive = permissionsOrIsActive;
      failedLoginAttempts = authorizationVersionOrFailedLoginAttempts;
      blockedUntil = isActiveOrBlockedUntil instanceof Date || isActiveOrBlockedUntil === null
        ? isActiveOrBlockedUntil
        : null;
    }

    return new User(
      id,
      Email.create(email),
      name,
      primaryRole,
      [...permissions],
      authorizationVersion,
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

  get primaryRole(): UserRole {
    return this._primaryRole;
  }

  get permissions(): Permission[] {
    return [...this._permissions];
  }

  get authorizationVersion(): number {
    return this._authorizationVersion;
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
    this._authorizationVersion += 1;
  }

  assignRole(role: UserRole): void {
    this._primaryRole = role;
    this._permissions = permissionsForRole(role);
    this._authorizationVersion += 1;
  }

  recordSuccessfulLogin(): void {
    this._failedLoginAttempts = 0;
    this._blockedUntil = null;
  }

  recordFailedLogin(at: Date, maxAttempts: number, lockDurationMs: number): void {
    if (this._blockedUntil !== null && at.getTime() < this._blockedUntil.getTime()) {
      return;
    }

    if (this._blockedUntil !== null && at.getTime() >= this._blockedUntil.getTime()) {
      this._failedLoginAttempts = 0;
      this._blockedUntil = null;
    }

    this._failedLoginAttempts += 1;
    if (this._failedLoginAttempts >= maxAttempts) {
      this._blockedUntil = new Date(at.getTime() + lockDurationMs);
    }
  }
}

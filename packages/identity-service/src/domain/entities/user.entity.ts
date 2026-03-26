import { Email } from "../value-objects/email.vo";
import {
  DEFAULT_USER_ROLE,
  PERMISSION_VALUES,
  USER_ROLE_VALUES,
  permissionsForRoles,
  uniqueRoles,
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
    private _roles: UserRole[],
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
    primaryRole: UserRole = DEFAULT_USER_ROLE,
    roles: UserRole[] = [primaryRole]
  ): User {
    if (!name || name.trim().length === 0) {
      throw new Error("Name is required");
    }
    User.assertRolesInvariant(primaryRole, roles);
    const normalizedRoles = uniqueRoles(roles);
    return new User(
      id,
      email,
      name.trim(),
      primaryRole,
      normalizedRoles,
      permissionsForRoles(normalizedRoles),
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
    primaryRole?: UserRole,
    roles?: UserRole[],
    permissions?: Permission[],
    authorizationVersion?: number,
    isActive?: boolean,
    failedLoginAttempts?: number,
    blockedUntil?: Date | null
  ): User;
  static reconstitute(
    id: string,
    email: string,
    name: string,
    createdAt: Date,
    primaryRole: UserRole,
    isActive: boolean,
    failedLoginAttempts?: number,
    blockedUntil?: Date | null
  ): User;
  static reconstitute(
    id: string,
    email: string,
    name: string,
    createdAt: Date,
    primaryRole: UserRole = DEFAULT_USER_ROLE,
    rolesOrIsActive: UserRole[] | boolean = [primaryRole],
    permissionsOrFailedLoginAttempts: Permission[] | number = permissionsForRoles([primaryRole]),
    authorizationVersionOrBlockedUntil: number | Date | null = 1,
    isActive = true,
    failedLoginAttempts = 0,
    blockedUntil: Date | null = null
  ): User {
    if (typeof rolesOrIsActive === "boolean") {
      return User.reconstituteLegacy(
        id,
        email,
        name,
        createdAt,
        primaryRole,
        rolesOrIsActive,
        typeof permissionsOrFailedLoginAttempts === "number"
          ? permissionsOrFailedLoginAttempts
          : failedLoginAttempts,
        User.isDateOrNull(authorizationVersionOrBlockedUntil)
          ? authorizationVersionOrBlockedUntil
          : blockedUntil
      );
    }

    if (!User.isUserRoleArray(rolesOrIsActive)) {
      throw new Error("Invalid roles while reconstituting user");
    }

    if (
      !Array.isArray(permissionsOrFailedLoginAttempts) ||
      !permissionsOrFailedLoginAttempts.every(User.isPermission)
    ) {
      throw new Error("Invalid permissions while reconstituting user");
    }

    if (
      typeof authorizationVersionOrBlockedUntil !== "number" ||
      !Number.isInteger(authorizationVersionOrBlockedUntil) ||
      authorizationVersionOrBlockedUntil <= 0
    ) {
      throw new Error("Invalid authorization version while reconstituting user");
    }

    if (typeof isActive !== "boolean") {
      throw new Error("Invalid active flag while reconstituting user");
    }

    if (!Number.isInteger(failedLoginAttempts) || failedLoginAttempts < 0) {
      throw new Error("Invalid failed login attempts while reconstituting user");
    }

    if (!User.isDateOrNull(blockedUntil)) {
      throw new Error("Invalid blockedUntil while reconstituting user");
    }

    const roles = uniqueRoles(rolesOrIsActive);
    User.assertRolesInvariant(primaryRole, roles);

    return new User(
      id,
      Email.create(email),
      name,
      primaryRole,
      roles,
      [...permissionsOrFailedLoginAttempts],
      authorizationVersionOrBlockedUntil,
      isActive,
      failedLoginAttempts,
      blockedUntil,
      createdAt
    );
  }

  static reconstituteLegacy(
    id: string,
    email: string,
    name: string,
    createdAt: Date,
    primaryRole: UserRole = DEFAULT_USER_ROLE,
    isActive = true,
    failedLoginAttempts = 0,
    blockedUntil: Date | null = null
  ): User {
    if (typeof isActive !== "boolean") {
      throw new Error("Invalid active flag while reconstituting user");
    }

    if (!Number.isInteger(failedLoginAttempts) || failedLoginAttempts < 0) {
      throw new Error("Invalid failed login attempts while reconstituting user");
    }

    if (!User.isDateOrNull(blockedUntil)) {
      throw new Error("Invalid blockedUntil while reconstituting user");
    }

    const roles = [primaryRole];
    const permissions = permissionsForRoles(roles);
    User.assertRolesInvariant(primaryRole, roles);

    return new User(
      id,
      Email.create(email),
      name,
      primaryRole,
      roles,
      permissions,
      1,
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

  get roles(): UserRole[] {
    return [...this._roles];
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
    this.setActive(false);
  }

  setActive(isActive: boolean): void {
    if (this._isActive === isActive) {
      return;
    }
    this._isActive = isActive;
    this._authorizationVersion += 1;
  }

  setBlockedUntil(blockedUntil: Date | null): void {
    const nextTime = blockedUntil?.getTime() ?? null;
    const currentTime = this._blockedUntil?.getTime() ?? null;
    if (nextTime === currentTime) {
      return;
    }

    this._blockedUntil = blockedUntil ? new Date(blockedUntil.getTime()) : null;
    if (this._blockedUntil === null) {
      this._failedLoginAttempts = 0;
    } else if (this._failedLoginAttempts <= 0) {
      this._failedLoginAttempts = 1;
    }
    this._authorizationVersion += 1;
  }

  assignRoles(primaryRole: UserRole, roles: UserRole[]): void {
    User.assertRolesInvariant(primaryRole, roles);
    const normalizedRoles = uniqueRoles(roles);
    this._primaryRole = primaryRole;
    this._roles = normalizedRoles;
    this._permissions = permissionsForRoles(normalizedRoles);
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
      this._authorizationVersion += 1;
    }
  }

  private static assertRolesInvariant(primaryRole: UserRole, roles: UserRole[]): void {
    const normalizedRoles = uniqueRoles(roles);
    if (normalizedRoles.length === 0) {
      throw new Error("User must have at least one role");
    }
    if (!normalizedRoles.includes(primaryRole)) {
      throw new Error("Primary role must be included in roles");
    }
    if (normalizedRoles.length !== roles.length) {
      throw new Error("User roles must not contain duplicates");
    }
  }

  private static isUserRoleArray(value: unknown): value is UserRole[] {
    return Array.isArray(value) && value.every((item) => USER_ROLE_VALUES.includes(item as UserRole));
  }

  private static isPermission(value: unknown): value is Permission {
    return PERMISSION_VALUES.includes(value as Permission);
  }

  private static isDateOrNull(value: unknown): value is Date | null {
    return value instanceof Date || value === null;
  }
}

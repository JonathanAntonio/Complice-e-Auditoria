export interface AdminUserDto {
  id: string;
  email: string;
  name: string;
  primaryRole: string;
  roles: string[];
  permissions: string[];
  authzVersion: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminUsersListDto {
  items: AdminUserDto[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminUsersQueryDto {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface AdminCreateUserInputDto {
  email: string;
  name: string;
}

export interface AdminUpdateUserRolesInputDto {
  primaryRole: string;
  roles: string[];
}

export interface AdminUpdateUserSecurityInputDto {
  isActive?: boolean;
  blockedUntil?: string | null;
}

export function parseAdminUsersQueryDto(input: unknown): AdminUsersQueryDto {
  if (!input || typeof input !== "object") return {};
  const source = input as Record<string, unknown>;
  const page = toOptionalPositiveInt(source.page);
  const pageSize = toOptionalPositiveInt(source.pageSize);
  const search = typeof source.search === "string" && source.search.trim().length > 0
    ? source.search.trim()
    : undefined;
  return {
    ...(page ? { page } : {}),
    ...(pageSize ? { pageSize } : {}),
    ...(search ? { search } : {}),
  };
}

export function parseAdminUsersListDto(payload: unknown): AdminUsersListDto {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid users list response");
  }
  const source = payload as { items?: unknown; page?: unknown; pageSize?: unknown; total?: unknown };
  if (!Array.isArray(source.items)) {
    throw new Error("Invalid users list response");
  }
  if (!Number.isInteger(source.page) || !Number.isInteger(source.pageSize) || !Number.isInteger(source.total)) {
    throw new Error("Invalid users list response");
  }
  return {
    items: source.items.map(parseAdminUserDto),
    page: Number(source.page),
    pageSize: Number(source.pageSize),
    total: Number(source.total),
  };
}

export function parseAdminUserDto(payload: unknown): AdminUserDto {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid user response");
  }
  const source = payload as Record<string, unknown>;
  if (
    typeof source.id !== "string" ||
    typeof source.email !== "string" ||
    typeof source.name !== "string" ||
    typeof source.primaryRole !== "string" ||
    !Array.isArray(source.roles) ||
    !Array.isArray(source.permissions) ||
    typeof source.authzVersion !== "number" ||
    typeof source.isActive !== "boolean" ||
    typeof source.createdAt !== "string"
  ) {
    throw new Error("Invalid user response");
  }
  return {
    id: source.id,
    email: source.email,
    name: source.name,
    primaryRole: source.primaryRole,
    roles: source.roles.filter((item): item is string => typeof item === "string"),
    permissions: source.permissions.filter((item): item is string => typeof item === "string"),
    authzVersion: source.authzVersion,
    isActive: source.isActive,
    createdAt: source.createdAt,
  };
}

export function parseAdminCreateUserInputDto(input: unknown): AdminCreateUserInputDto {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid user creation payload");
  }
  const source = input as Record<string, unknown>;
  const email = typeof source.email === "string" ? source.email.trim() : "";
  const name = typeof source.name === "string" ? source.name.trim() : "";
  if (!email || !name) {
    throw new Error("Invalid user creation payload");
  }
  return { email, name };
}

export function parseAdminUpdateUserRolesInputDto(input: unknown): AdminUpdateUserRolesInputDto {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid user roles payload");
  }
  const source = input as Record<string, unknown>;
  const primaryRole = typeof source.primaryRole === "string" ? source.primaryRole.trim() : "";
  const roles = Array.isArray(source.roles)
    ? source.roles.filter((role): role is string => typeof role === "string" && role.trim().length > 0).map((role) => role.trim())
    : [];
  if (!primaryRole || roles.length === 0 || !roles.includes(primaryRole)) {
    throw new Error("Invalid user roles payload");
  }
  return { primaryRole, roles: Array.from(new Set(roles)) };
}

export function parseAdminUpdateUserSecurityInputDto(input: unknown): AdminUpdateUserSecurityInputDto {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid user security payload");
  }
  const source = input as Record<string, unknown>;
  const isActive = typeof source.isActive === "boolean" ? source.isActive : undefined;
  let blockedUntil: string | null | undefined;
  if (source.blockedUntil === null) blockedUntil = null;
  if (typeof source.blockedUntil === "string" && source.blockedUntil.trim().length > 0) {
    blockedUntil = source.blockedUntil.trim();
  }
  if (isActive === undefined && blockedUntil === undefined) {
    throw new Error("Invalid user security payload");
  }
  return {
    ...(isActive !== undefined ? { isActive } : {}),
    ...(blockedUntil !== undefined ? { blockedUntil } : {}),
  };
}

function toOptionalPositiveInt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

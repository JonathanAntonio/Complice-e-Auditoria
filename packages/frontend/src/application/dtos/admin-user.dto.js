const USER_ROLES = new Set([
  "administrador",
  "compliance_officer",
  "auditor_interno",
  "auditor_externo",
  "gestor",
  "visualizador",
]);

export function parseAdminUsersListDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta inválida de usuários.");
  }
  const payload = raw;
  if (!Array.isArray(payload.items)) {
    throw new Error("Resposta inválida de usuários.");
  }
  return {
    items: payload.items.map(parseAdminUserDto),
    page: Number.isInteger(payload.page) ? payload.page : 1,
    pageSize: Number.isInteger(payload.pageSize) ? payload.pageSize : payload.items.length,
    total: Number.isInteger(payload.total) ? payload.total : payload.items.length,
  };
}

export function parseAdminUserDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Usuário inválido.");
  }
  const payload = raw;
  if (
    typeof payload.id !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string" ||
    typeof payload.primaryRole !== "string" ||
    !Array.isArray(payload.roles) ||
    typeof payload.isActive !== "boolean"
  ) {
    throw new Error("Usuário inválido.");
  }

  return {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    primaryRole: payload.primaryRole,
    roles: payload.roles.filter((item) => typeof item === "string"),
    permissions: Array.isArray(payload.permissions)
      ? payload.permissions.filter((item) => typeof item === "string")
      : [],
    authzVersion: typeof payload.authzVersion === "number" ? payload.authzVersion : 1,
    isActive: payload.isActive,
    createdAt: typeof payload.createdAt === "string" ? payload.createdAt : new Date().toISOString(),
  };
}

export function parseAdminListUsersQueryDto(raw = {}) {
  if (!raw || typeof raw !== "object") return {};
  const source = raw;
  const page = Number.isInteger(source.page) && source.page > 0 ? source.page : undefined;
  const pageSize = Number.isInteger(source.pageSize) && source.pageSize > 0 ? source.pageSize : undefined;
  const search = typeof source.search === "string" && source.search.trim().length > 0
    ? source.search.trim()
    : undefined;
  return {
    ...(page ? { page } : {}),
    ...(pageSize ? { pageSize } : {}),
    ...(search ? { search } : {}),
  };
}

export function parseAdminCreateUserInputDto(raw) {
  if (!raw || typeof raw !== "object") throw new Error("Payload inválido para criação.");
  const source = raw;
  const email = typeof source.email === "string" ? source.email.trim() : "";
  const name = typeof source.name === "string" ? source.name.trim() : "";
  if (!email || !name) throw new Error("Payload inválido para criação.");
  return { email, name };
}

export function parseAdminUpdateUserRolesInputDto(raw) {
  if (!raw || typeof raw !== "object") throw new Error("Payload inválido para cargos.");
  const source = raw;
  const primaryRole = typeof source.primaryRole === "string" ? source.primaryRole.trim() : "";
  const roles = Array.isArray(source.roles)
    ? source.roles.filter((item) => typeof item === "string" && USER_ROLES.has(item.trim())).map((item) => item.trim())
    : [];
  if (!primaryRole || !USER_ROLES.has(primaryRole) || roles.length === 0 || !roles.includes(primaryRole)) {
    throw new Error("Payload inválido para cargos.");
  }
  return { primaryRole, roles: Array.from(new Set(roles)) };
}

export function parseAdminUpdateUserSecurityInputDto(raw) {
  if (!raw || typeof raw !== "object") throw new Error("Payload inválido para segurança.");
  const source = raw;
  const isActive = typeof source.isActive === "boolean" ? source.isActive : undefined;
  let blockedUntil;
  if (source.blockedUntil === null) blockedUntil = null;
  if (typeof source.blockedUntil === "string" && source.blockedUntil.trim().length > 0) {
    blockedUntil = source.blockedUntil.trim();
  }
  if (isActive === undefined && blockedUntil === undefined) throw new Error("Payload inválido para segurança.");
  return {
    ...(isActive !== undefined ? { isActive } : {}),
    ...(blockedUntil !== undefined ? { blockedUntil } : {}),
  };
}

export function parseAuthSessionDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta inválida de sessão.");
  }

  const payload = raw;
  if (typeof payload.id !== "string" || typeof payload.email !== "string" || typeof payload.name !== "string") {
    throw new Error("Resposta inválida de sessão.");
  }

  return {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    primaryRole: typeof payload.primaryRole === "string" ? payload.primaryRole : null,
    roles: Array.isArray(payload.roles) ? payload.roles.filter((item) => typeof item === "string") : [],
    permissions: Array.isArray(payload.permissions)
      ? payload.permissions.filter((item) => typeof item === "string")
      : [],
    authzVersion: typeof payload.authzVersion === "number" ? payload.authzVersion : 0,
    isActive: typeof payload.isActive === "boolean" ? payload.isActive : true,
    createdAt: typeof payload.createdAt === "string" ? payload.createdAt : null,
  };
}

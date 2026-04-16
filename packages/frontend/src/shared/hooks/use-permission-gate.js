import { useSession } from "../../features/auth/context/session-context";

export function usePermissionGate(requiredAny = []) {
  const { isAuthenticated, hasAnyPermission } = useSession();

  if (!Array.isArray(requiredAny) || requiredAny.length === 0) {
    return { allowed: isAuthenticated, missing: [] };
  }

  const allowed = hasAnyPermission(requiredAny);
  return {
    allowed,
    missing: allowed ? [] : requiredAny,
  };
}

import { createContext, useContext, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logoutSession } from "../../../bff-client";
import { useSessionQuery } from "../queries/use-session.query";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const queryClient = useQueryClient();
  const sessionQuery = useSessionQuery();

  const logoutMutation = useMutation({
    mutationFn: logoutSession,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });

  const value = useMemo(() => {
    const session = sessionQuery.data ?? null;
    const permissions = new Set(Array.isArray(session?.permissions) ? session.permissions : []);

    return {
      session,
      permissions,
      isLoading: sessionQuery.isLoading,
      isRefreshing: sessionQuery.isFetching,
      isAuthenticated: Boolean(session),
      error: sessionQuery.error instanceof Error ? sessionQuery.error : null,
      refreshSession: sessionQuery.refetch,
      logout: () => logoutMutation.mutateAsync(),
      hasPermission: (permission) => permissions.has(permission),
      hasAnyPermission: (required = []) => required.some((permission) => permissions.has(permission)),
    };
  }, [logoutMutation, sessionQuery.data, sessionQuery.error, sessionQuery.isFetching, sessionQuery.isLoading, sessionQuery.refetch]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}

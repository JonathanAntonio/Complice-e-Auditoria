import { useQuery } from "@tanstack/react-query";
import { getCurrentUserSession } from "../../../bff-client";

async function loadSession() {
  try {
    return await getCurrentUserSession();
  } catch (err) {
    if (err instanceof Error && err.message === "Não autenticado.") {
      return null;
    }
    if (err instanceof TypeError) {
      return null;
    }
    throw err;
  }
}

export function useSessionQuery() {
  return useQuery({
    queryKey: ["session"],
    queryFn: loadSession,
    retry: false,
  });
}

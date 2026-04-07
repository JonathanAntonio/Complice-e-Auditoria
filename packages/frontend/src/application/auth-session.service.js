import { requestBffAuth } from "../infrastructure/http/bff-auth.api";

export async function getCurrentUserSession() {
  return requestBffAuth("/me", { defaultErrorMessage: "Não autenticado." });
}

export async function logoutSession() {
  return requestBffAuth("/logout", {
    method: "POST",
    defaultErrorMessage: "Falha ao encerrar sessão.",
  });
}

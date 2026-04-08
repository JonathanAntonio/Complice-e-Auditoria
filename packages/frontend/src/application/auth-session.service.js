import { requestBffAuth } from "../infrastructure/http/bff-auth.api";
import { parseAuthSessionDto } from "./dtos/auth-session.dto";

export async function getCurrentUserSession() {
  const payload = await requestBffAuth("/me", { defaultErrorMessage: "Não autenticado." });
  return parseAuthSessionDto(payload);
}

export async function logoutSession() {
  return requestBffAuth("/logout", {
    method: "POST",
    defaultErrorMessage: "Falha ao encerrar sessão.",
  });
}

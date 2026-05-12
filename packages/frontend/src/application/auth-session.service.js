import { requestBffAuth } from "../infrastructure/http/bff-auth.api";
import { parseAuthSessionDto } from "./dtos/auth-session.dto";

export async function getCurrentUserSession() {
  const payload = await requestBffAuth("/me", { defaultErrorMessage: "Não autenticado." });
  return parseAuthSessionDto(payload);
}

export async function login(email, password) {
  return requestBffAuth("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    defaultErrorMessage: "E-mail ou senha inválidos.",
  });
}

export async function register(email, password, name) {
  return requestBffAuth("/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
    defaultErrorMessage: "Falha ao criar conta.",
  });
}

export async function logoutSession() {
  return requestBffAuth("/logout", {
    method: "POST",
    defaultErrorMessage: "Falha ao encerrar sessão.",
  });
}

const BFF_AUTH_BASE = "/auth";

function parseErrorPayload(payload, fallbackMessage) {
  if (payload && typeof payload === "object") {
    if (typeof payload.message === "string" && payload.message.length > 0) return payload.message;
    if (typeof payload.error === "string" && payload.error.length > 0) return payload.error;
  }
  return fallbackMessage;
}

async function parseResponse(response, defaultErrorMessage) {
  if (response.status === 204) return null;

  const raw = await response.text();
  let payload = raw;

  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = raw;
  }

  if (!response.ok) {
    throw new Error(parseErrorPayload(payload, defaultErrorMessage));
  }

  return payload;
}

export async function requestBffAuth(path, options = {}) {
  const {
    method = "GET",
    body,
    defaultErrorMessage = "Falha na comunicação com o BFF.",
  } = options;

  const hasBody = body !== undefined;

  const response = await fetch(`${BFF_AUTH_BASE}${path}`, {
    method,
    headers: hasBody
      ? { Accept: "application/json", "Content-Type": "application/json" }
      : { Accept: "application/json" },
    body,
    credentials: "include",
  });

  return parseResponse(response, defaultErrorMessage);
}

export async function exchangeOAuthCallback(provider, code, state) {
  const normalizedProvider = typeof provider === "string" ? provider.trim().toLowerCase() : "";
  if (normalizedProvider !== "google" && normalizedProvider !== "github") {
    throw new Error("Provedor OAuth inválido.");
  }
  if (typeof code !== "string" || code.length === 0 || typeof state !== "string" || state.length === 0) {
    throw new Error("Parâmetros OAuth inválidos.");
  }

  const query = new URLSearchParams({ code, state });
  return requestBffAuth(`/${normalizedProvider}/exchange?${query.toString()}`, {
    method: "GET",
    defaultErrorMessage: "Falha ao concluir login OAuth.",
  });
}

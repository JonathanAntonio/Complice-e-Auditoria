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

export async function requestBffMessaging(path, options = {}) {
  const { method = "GET", body, defaultErrorMessage = "Falha na comunicação com o BFF (messaging)." } = options;
  const hasBody = body !== undefined;
  const response = await fetch(`/messaging${path}`, {
    method,
    headers: hasBody
      ? { Accept: "application/json", "Content-Type": "application/json" }
      : { Accept: "application/json" },
    body: hasBody ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  return parseResponse(response, defaultErrorMessage);
}

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
    const message =
      payload && typeof payload === "object"
        ? payload.message || payload.error || defaultErrorMessage
        : defaultErrorMessage;
    throw new Error(message);
  }

  return payload;
}

export async function requestBffHealth(path, options = {}) {
  const {
    method = "GET",
    defaultErrorMessage = "Falha na comunicação com o BFF (health).",
  } = options;

  const response = await fetch(`${path}`, {
    method,
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  return parseResponse(response, defaultErrorMessage);
}

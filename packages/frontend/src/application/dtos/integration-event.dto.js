export function parsePublishIntegrationEventInputDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Payload inválido para evento de integração.");
  }

  const payload = raw;
  const type = typeof payload.type === "string" ? payload.type.trim() : "";
  const eventPayload = payload.payload;
  const correlationId = typeof payload.correlationId === "string" && payload.correlationId.trim()
    ? payload.correlationId.trim()
    : undefined;

  if (!type) throw new Error("Tipo de evento inválido.");
  if (!eventPayload || typeof eventPayload !== "object" || Array.isArray(eventPayload)) {
    throw new Error("Payload do evento inválido.");
  }

  return {
    type,
    payload: eventPayload,
    ...(correlationId ? { correlationId } : {}),
  };
}

export function parsePublishIntegrationEventResultDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta inválida de evento de integração.");
  }

  const payload = raw;
  if (
    typeof payload.accepted !== "boolean" ||
    typeof payload.duplicate !== "boolean" ||
    typeof payload.eventId !== "string"
  ) {
    throw new Error("Resposta inválida de evento de integração.");
  }

  return {
    accepted: payload.accepted,
    duplicate: payload.duplicate,
    eventId: payload.eventId,
  };
}

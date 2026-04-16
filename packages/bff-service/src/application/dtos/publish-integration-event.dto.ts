export interface PublishIntegrationEventDto {
  type: string;
  payload: Record<string, unknown>;
  correlationId?: string;
}

export function parsePublishIntegrationEventDto(raw: unknown): PublishIntegrationEventDto | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const type = typeof source.type === "string" ? source.type.trim() : "";
  const payload = source.payload;
  const correlationId = typeof source.correlationId === "string" && source.correlationId.trim().length > 0
    ? source.correlationId.trim()
    : undefined;

  if (!type) return null;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;

  return {
    type,
    payload: payload as Record<string, unknown>,
    ...(correlationId ? { correlationId } : {}),
  };
}

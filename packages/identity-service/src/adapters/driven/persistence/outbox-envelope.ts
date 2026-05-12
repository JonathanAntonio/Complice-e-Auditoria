import {
  createEventEnvelopeV1,
  type EventEnvelopeV1,
} from "@lframework/shared";
import type { OutboxEvent } from "../../../application/ports";

function readCorrelationId(event: OutboxEvent): string | undefined {
  if (event.correlationId && event.correlationId.trim().length > 0) {
    return event.correlationId;
  }
  const payload = event.payload as { requestId?: unknown; correlationId?: unknown };
  if (typeof payload.correlationId === "string" && payload.correlationId.trim().length > 0) {
    return payload.correlationId;
  }
  if (typeof payload.requestId === "string" && payload.requestId.trim().length > 0) {
    return payload.requestId;
  }
  return undefined;
}

export function toEnvelope(event: OutboxEvent): EventEnvelopeV1 {
  if (event.envelope) {
    return event.envelope;
  }
  return createEventEnvelopeV1({
    type: event.eventName,
    producer: event.producer ?? "identity-service",
    correlationId: readCorrelationId(event),
    payload: event.payload as Record<string, unknown>,
  });
}

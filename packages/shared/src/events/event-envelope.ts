import { randomUUID } from "crypto";
import { z } from "zod";

export const EVENT_ENVELOPE_VERSION_V1 = "1.0" as const;

export interface EventEnvelopeV1<TPayload extends object = Record<string, unknown>> {
  eventId: string;
  type: string;
  occurredAtUTC: string;
  producer: string;
  correlationId: string;
  payload: TPayload;
  version: typeof EVENT_ENVELOPE_VERSION_V1;
}

const baseEnvelopeSchema = z.object({
  eventId: z.string().uuid("eventId must be a valid UUID"),
  type: z.string().min(1, "type is required"),
  occurredAtUTC: z
    .string()
    .min(1, "occurredAtUTC is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), "occurredAtUTC must be a valid ISO 8601 date"),
  producer: z.string().min(1, "producer is required"),
  correlationId: z.string().min(1, "correlationId is required").max(256),
  payload: z.record(z.unknown()),
  version: z.literal(EVENT_ENVELOPE_VERSION_V1),
});

export const eventEnvelopeV1Schema = baseEnvelopeSchema;

export function createEventEnvelopeV1<TPayload extends object>(params: {
  type: string;
  producer: string;
  payload: TPayload;
  correlationId?: string;
  occurredAtUTC?: string;
  eventId?: string;
  version?: typeof EVENT_ENVELOPE_VERSION_V1;
}): EventEnvelopeV1<TPayload> {
  const envelope: EventEnvelopeV1<TPayload> = {
    eventId: params.eventId ?? randomUUID(),
    type: params.type,
    occurredAtUTC: params.occurredAtUTC ?? new Date().toISOString(),
    producer: params.producer,
    correlationId: params.correlationId && params.correlationId.trim().length > 0 ? params.correlationId : randomUUID(),
    payload: params.payload,
    version: params.version ?? EVENT_ENVELOPE_VERSION_V1,
  };
  return validateEventEnvelopeV1(envelope) as EventEnvelopeV1<TPayload>;
}

export function validateEventEnvelopeV1(input: unknown): EventEnvelopeV1 {
  return eventEnvelopeV1Schema.parse(input);
}

export function serializeEventEnvelopeV1<TPayload extends object>(envelope: EventEnvelopeV1<TPayload>): Buffer {
  return Buffer.from(JSON.stringify(envelope));
}

export function parseEventEnvelopeV1(input: string | Buffer | unknown): EventEnvelopeV1 {
  if (typeof input === "string") {
    return validateEventEnvelopeV1(JSON.parse(input));
  }
  if (Buffer.isBuffer(input)) {
    return validateEventEnvelopeV1(JSON.parse(input.toString("utf8")));
  }
  return validateEventEnvelopeV1(input);
}

export interface EventPublisherChannel {
  publish(exchange: string, routingKey: string, content: Buffer, options?: Record<string, unknown>): boolean;
}

export interface EventConsumeMessageLike {
  content: Buffer;
}

export function routingKeyFromEventType(type: string): string {
  return type.replace(/\./g, "_");
}

export function publishEventEnvelopeV1<TPayload extends object>(
  channel: EventPublisherChannel,
  exchange: string,
  envelope: EventEnvelopeV1<TPayload>,
  routingKey?: string
): boolean {
  const key = routingKey ?? routingKeyFromEventType(envelope.type);
  return channel.publish(exchange, key, serializeEventEnvelopeV1(envelope), { persistent: true });
}

export function consumeEventEnvelopeV1(message: EventConsumeMessageLike): EventEnvelopeV1 {
  return parseEventEnvelopeV1(message.content);
}

export const createEnvelope = createEventEnvelopeV1;
export const validateEnvelope = validateEventEnvelopeV1;
export const serializeEnvelope = serializeEventEnvelopeV1;
export const parseEnvelope = parseEventEnvelopeV1;
export const publishEnvelope = publishEventEnvelopeV1;
export const consumeEnvelope = consumeEventEnvelopeV1;

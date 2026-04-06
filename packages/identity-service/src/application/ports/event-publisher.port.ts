import type { EventEnvelopeV1 } from "@lframework/shared";

/**
 * Porta: publicador de eventos (ex.: RabbitMQ).
 * Implementação em infrastructure/messaging.
 */
export interface IEventPublisher {
  publish(envelope: EventEnvelopeV1): Promise<void>;
}

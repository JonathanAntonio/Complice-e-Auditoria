import type { UserCreatedPayload, EventEnvelopeV1 } from "@lframework/shared";

/**
 * Porta: consumidor de eventos (ex.: RabbitMQ).
 * O application registra handlers; o adapter RabbitMQ chama quando mensagem chega.
 */
export interface IEventConsumer {
  onUserCreated(handler: (payload: UserCreatedPayload) => Promise<void>): void;
  onDomainEvent(handler: (envelope: EventEnvelopeV1) => Promise<void>): void;
}

import amqp from "amqplib";
import type { UserCreatedPayload, EventEnvelopeV1 } from "@lframework/shared";
import type { IEventConsumer } from "../../../application/ports";
import { RabbitMqUserCreatedConsumer } from "./rabbitmq-user-created.consumer";
import { RabbitMqDomainEventsConsumer } from "./rabbitmq-domain-events.consumer";

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

/**
 * Adapter que implementa IEventConsumer usando RabbitMQ.
 * Encapsula conexão e ciclo de vida (start/close) para uso no container.
 */
export class RabbitMqUserEventsAdapter implements IEventConsumer {
  private userHandler: ((payload: UserCreatedPayload) => Promise<void>) | null = null;
  private domainHandler: ((envelope: EventEnvelopeV1) => Promise<void>) | null = null;
  private userConsumer: RabbitMqUserCreatedConsumer | null = null;
  private domainConsumer: RabbitMqDomainEventsConsumer | null = null;
  private connection: AmqpConnection | null = null;

  /** Timeout de conexão em ms (evita espera indefinida se o broker estiver indisponível). */
  private static readonly CONNECT_TIMEOUT_MS = 10_000;

  constructor(private readonly rabbitmqUrl: string) {}

  onUserCreated(handler: (payload: UserCreatedPayload) => Promise<void>): void {
    this.userHandler = handler;
  }

  onDomainEvent(handler: (envelope: EventEnvelopeV1) => Promise<void>): void {
    this.domainHandler = handler;
  }

  getChannel(): amqp.Channel | null {
    return this.userConsumer?.getChannel() ?? this.domainConsumer?.getChannel() ?? null;
  }

  async start(): Promise<void> {
    this.connection = await amqp.connect(this.rabbitmqUrl, {
      timeout: RabbitMqUserEventsAdapter.CONNECT_TIMEOUT_MS,
    });

    if (this.userHandler) {
      this.userConsumer = new RabbitMqUserCreatedConsumer(this.connection);
      this.userConsumer.onUserCreated(this.userHandler);
      await this.userConsumer.start();
    }

    if (this.domainHandler) {
      this.domainConsumer = new RabbitMqDomainEventsConsumer(this.connection);
      this.domainConsumer.onDomainEvent(this.domainHandler);
      await this.domainConsumer.start();
    }
  }

  async close(): Promise<void> {
    if (this.userConsumer) {
      await this.userConsumer.close();
      this.userConsumer = null;
    }
    if (this.domainConsumer) {
      await this.domainConsumer.close();
      this.domainConsumer = null;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
}

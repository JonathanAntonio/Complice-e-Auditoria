import amqp from "amqplib";
import {
  EXCHANGE_USER_EVENTS,
  publishEventEnvelopeV1,
  type EventEnvelopeV1,
} from "@lframework/shared";

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

export class RabbitMqEventPublisherAdapter {
  private connection: AmqpConnection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly exchange = EXCHANGE_USER_EVENTS;
  private static readonly CONNECT_TIMEOUT_MS = 10_000;

  constructor(private readonly rabbitmqUrl: string) {}

  async connect(): Promise<void> {
    if (this.connection && this.channel) {
      return;
    }

    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }

    this.connection = await amqp.connect(this.rabbitmqUrl, {
      timeout: RabbitMqEventPublisherAdapter.CONNECT_TIMEOUT_MS,
    });
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(this.exchange, "topic", { durable: true });
  }

  async publish(envelope: EventEnvelopeV1): Promise<void> {
    if (!this.channel) {
      throw new Error("RabbitMqEventPublisherAdapter not connected; call connect() first.");
    }
    await publishEventEnvelopeV1(this.channel, this.exchange, envelope);
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
}

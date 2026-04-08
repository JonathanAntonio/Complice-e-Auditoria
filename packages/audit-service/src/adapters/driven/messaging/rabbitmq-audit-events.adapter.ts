import amqp from "amqplib";
import {
  consumeEventEnvelopeV1,
  EXCHANGE_USER_EVENTS,
  logger,
  QUEUE_AUDIT_EVENTS,
  type EventEnvelopeV1,
} from "@lframework/shared";
import type { IngestAuditEventUseCase } from "../../../application/use-cases/ingest-audit-event.use-case";

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

export class RabbitMqAuditEventsAdapter {
  private connection: AmqpConnection | null = null;
  private channel: amqp.Channel | null = null;
  private static readonly CONNECT_TIMEOUT_MS = 10_000;

  constructor(
    private readonly rabbitmqUrl: string,
    private readonly queueName: string = QUEUE_AUDIT_EVENTS,
  ) {}

  async start(ingestAuditEventUseCase: IngestAuditEventUseCase): Promise<void> {
    if (this.connection && this.channel) {
      return;
    }

    this.connection = await amqp.connect(this.rabbitmqUrl, {
      timeout: RabbitMqAuditEventsAdapter.CONNECT_TIMEOUT_MS,
    });
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(EXCHANGE_USER_EVENTS, "topic", { durable: true });
    await this.channel.assertQueue(this.queueName, { durable: true });
    await this.channel.bindQueue(this.queueName, EXCHANGE_USER_EVENTS, "#");

    await this.channel.consume(this.queueName, async (msg) => {
      if (!msg || !this.channel) return;

      try {
        const envelope = consumeEventEnvelopeV1(msg) as EventEnvelopeV1;
        await ingestAuditEventUseCase.execute(envelope);
        this.channel.ack(msg);
      } catch (err) {
        logger.error({ err }, "Audit service failed to consume event envelope");
        this.channel.nack(msg, false, false);
      }
    });
  }

  async close(): Promise<void> {
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

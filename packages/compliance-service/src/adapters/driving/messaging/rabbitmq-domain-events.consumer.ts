import amqp, { ConsumeMessage } from "amqplib";
import { LRUCache } from "lru-cache";
import {
  EXCHANGE_DOMAIN_EVENTS,
  QUEUE_DOMAIN_EVENTS_COMPLIANCE,
  consumeEventEnvelopeV1,
  routingKeyFromEventType,
  logger,
  type EventEnvelopeV1,
} from "@lframework/shared";

const MAX_RETRIES = 5;
const RETRY_BASE_MS = 2000;
const RETRY_HEADER = "x-retry-count";

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

export class RabbitMqDomainEventsConsumer {
  private handler: ((envelope: EventEnvelopeV1) => Promise<void>) | null = null;
  private channel: amqp.Channel | null = null;
  private readonly retryCountByMessageKey = new LRUCache<string, number>({
    max: 10_000,
    ttl: 1000 * 60 * 60,
  });
  private readonly pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();

  constructor(private readonly connection: AmqpConnection) {}

  onDomainEvent(fn: (envelope: EventEnvelopeV1) => Promise<void>): void {
    this.handler = fn;
  }

  getChannel(): amqp.Channel | null {
    return this.channel;
  }

  async start(): Promise<void> {
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(EXCHANGE_DOMAIN_EVENTS, "topic", { durable: true });
    await this.channel.assertQueue(QUEUE_DOMAIN_EVENTS_COMPLIANCE, { durable: true });
    await this.channel.bindQueue(
      QUEUE_DOMAIN_EVENTS_COMPLIANCE,
      EXCHANGE_DOMAIN_EVENTS,
      "#"
    );

    await this.channel.consume(QUEUE_DOMAIN_EVENTS_COMPLIANCE, async (msg: ConsumeMessage | null) => {
      if (!msg || !this.handler || !this.channel) return;

      try {
        const envelope = consumeEventEnvelopeV1(msg) as EventEnvelopeV1;
        await this.handler(envelope);
        this.retryCountByMessageKey.delete(msg.content.toString());
        this.channel.ack(msg);
      } catch (err) {
        const messageKey = msg.content.toString();
        const prevCount =
          (typeof msg.properties?.headers?.[RETRY_HEADER] === "number"
            ? msg.properties.headers[RETRY_HEADER]
            : this.retryCountByMessageKey.get(messageKey)) ?? 0;
        const count = prevCount + 1;
        this.retryCountByMessageKey.set(messageKey, count);

        if (count >= MAX_RETRIES) {
          logger.error(
            { err, retries: count, messageKey: messageKey.slice(0, 200) },
            "Domain event message discarded after MAX_RETRIES attempts"
          );
          this.retryCountByMessageKey.delete(messageKey);
          this.channel.nack(msg, false, false);
        } else {
          const delayMs = RETRY_BASE_MS * 2 ** (count - 1);
          logger.warn(
            { err, retry: count, maxRetries: MAX_RETRIES, delayMs },
            "Error processing domain event, will republish after exponential backoff"
          );
          const contentCopy = Buffer.from(msg.content);
          const headers = { ...(msg.properties?.headers || {}), [RETRY_HEADER]: count };
          const timeoutId = setTimeout(() => {
            this.pendingTimeouts.delete(timeoutId);
            if (!this.channel) return;
            try {
              const envelope = consumeEventEnvelopeV1({ content: contentCopy });
              this.channel.publish(EXCHANGE_DOMAIN_EVENTS, routingKeyFromEventType(envelope.type), contentCopy, { headers });
              this.channel.nack(msg, false, false);
            } catch (publishErr) {
              logger.error({ err: publishErr, retry: count }, "Failed to republish domain event after backoff");
              this.channel.nack(msg, false, true);
            }
          }, delayMs);
          this.pendingTimeouts.add(timeoutId);
        }
      }
    });
  }

  async close(): Promise<void> {
    for (const id of this.pendingTimeouts) {
      clearTimeout(id);
    }
    this.pendingTimeouts.clear();
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
  }
}

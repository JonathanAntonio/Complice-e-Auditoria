import { logger } from "@lframework/shared";
import type { PrismaClient } from "../../../../generated/prisma-client";
import type { IEventPublisher } from "../../../application/ports/event-publisher.port";
import { parseEventEnvelopeV1 } from "@lframework/shared";

const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_INTERVAL_MS = 2_000;
const DEFAULT_MAX_RETRIES = 5;

/**
 * Reads unpublished outbox rows, publishes to the message broker, and marks them as published.
 * Run periodically so events are eventually published (Outbox Pattern).
 */
export class OutboxRelayAdapter {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventPublisher: IEventPublisher,
    private readonly batchSize: number = DEFAULT_BATCH_SIZE,
    private readonly maxRetries: number = DEFAULT_MAX_RETRIES
  ) {}

  /**
   * Process one batch of unpublished outbox rows.
   * Call this from a scheduler or use start() for an in-process interval.
   */
  async runOnce(): Promise<void> {
    const rows = await this.prisma.outboxModel.findMany({
      where: {
        publishedAt: null,
        failedAt: null,
        retryCount: { lt: this.maxRetries },
      },
      orderBy: { createdAt: "asc" },
      take: this.batchSize,
    });

    for (const row of rows) {
      try {
        const envelope = parseEventEnvelopeV1(row.payload);
        await this.eventPublisher.publish(envelope);
        await this.prisma.outboxModel.update({
          where: { id: row.id },
          data: { publishedAt: new Date(), lastError: null },
        });
      } catch (err) {
        const nextRetryCount = (row.retryCount ?? 0) + 1;
        if (nextRetryCount >= this.maxRetries) {
          await this.prisma.outboxModel.update({
            where: { id: row.id },
            data: {
              retryCount: nextRetryCount,
              lastError: err instanceof Error ? err.message : String(err),
              failedAt: new Date(),
            },
          });
          logger.warn(
            { err, outboxId: row.id, eventName: row.eventName, retryCount: nextRetryCount },
            "Outbox relay: max retries reached, row marked as failed"
          );
          continue;
        }

        await this.prisma.outboxModel.update({
          where: { id: row.id },
          data: {
            retryCount: nextRetryCount,
            lastError: err instanceof Error ? err.message : String(err),
          },
        });
        logger.warn(
          { err, outboxId: row.id, eventName: row.eventName, retryCount: nextRetryCount },
          "Outbox relay: publish/parse failed, will retry"
        );
      }
    }
  }

  /**
   * Start the relay loop. Call after connectRabbitMQ().
   */
  start(intervalMs: number = DEFAULT_INTERVAL_MS): void {
    if (this.timeoutId != null) {
      return;
    }
    this.stopped = false;
    const scheduleNext = (): void => {
      if (this.stopped) return;
      this.timeoutId = setTimeout(() => {
        this.runOnce()
          .catch((err) => logger.error({ err }, "Outbox relay runOnce failed"))
          .finally(() => {
            this.timeoutId = null;
            if (!this.stopped) scheduleNext();
          });
      }, intervalMs);
    };
    scheduleNext();
    logger.info({ intervalMs }, "Outbox relay started");
  }

  /**
   * Stop the relay loop. Call before disconnect.
   */
  stop(): void {
    this.stopped = true;
    if (this.timeoutId != null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
      logger.info("Outbox relay stopped");
    }
  }
}

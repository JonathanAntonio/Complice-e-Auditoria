import { logger, parseEventEnvelopeV1 } from "@lframework/shared";
import { OutboxStatus, type Prisma, type PrismaClient } from "../../../../generated/prisma-client";
import { IntegrationMetrics } from "../../../application/metrics";
import { RabbitMqEventPublisherAdapter } from "./rabbitmq-event-publisher.adapter";

const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_INTERVAL_MS = 2_000;
const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_STALE_PROCESSING_THRESHOLD_MS = 5 * 60 * 1000;

export class OutboxRelayAdapter {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventPublisher: RabbitMqEventPublisherAdapter,
    private readonly metrics: IntegrationMetrics,
    private readonly batchSize: number = DEFAULT_BATCH_SIZE,
    private readonly maxRetries: number = DEFAULT_MAX_RETRIES,
    private readonly staleProcessingThresholdMs: number = DEFAULT_STALE_PROCESSING_THRESHOLD_MS
  ) {}

  private async tryUpdateOutbox(
    outboxId: string,
    data: Prisma.OutboxModelUpdateInput,
    context: string
  ): Promise<boolean> {
    try {
      await this.prisma.outboxModel.update({
        where: { id: outboxId },
        data,
      });
      return true;
    } catch (updateErr) {
      logger.error({ err: updateErr, outboxId, context }, "Outbox relay failed to update row state");
      return false;
    }
  }

  private async tryDeadLetterFallback(outboxId: string, reason: string): Promise<void> {
    const updated = await this.tryUpdateOutbox(
      outboxId,
      {
        status: OutboxStatus.dead_letter,
        exhaustedAt: new Date(),
        lastError: reason,
      },
      "dead-letter-fallback"
    );
    if (updated) {
      this.metrics.deadLetterTotal.inc();
    }
  }

  async runOnce(): Promise<void> {
    const staleProcessingCutoff = new Date(Date.now() - this.staleProcessingThresholdMs);
    const recovered = await this.prisma.outboxModel.updateMany({
      where: {
        status: OutboxStatus.processing,
        updatedAt: { lt: staleProcessingCutoff },
      },
      data: {
        status: OutboxStatus.pending,
        lastError: "Recovered stale processing claim",
      },
    });
    if (recovered.count > 0) {
      logger.warn(
        { recoveredCount: recovered.count, thresholdMs: this.staleProcessingThresholdMs },
        "Recovered stale processing outbox rows back to pending"
      );
    }

    const rows = await this.prisma.outboxModel.findMany({
      where: {
        publishedAt: null,
        status: OutboxStatus.pending,
        retryCount: { lt: this.maxRetries },
      },
      orderBy: { createdAt: "asc" },
      take: this.batchSize,
    });

    for (const row of rows) {
      const claimed = await this.prisma.outboxModel.updateMany({
        where: {
          id: row.id,
          status: OutboxStatus.pending,
        },
        data: {
          status: OutboxStatus.processing,
        },
      });
      if (claimed.count === 0) {
        continue;
      }

      let publishedToBroker = false;
      try {
        const envelope = parseEventEnvelopeV1(row.payload);
        await this.eventPublisher.publish(envelope);
        publishedToBroker = true;
        const markedPublished = await this.tryUpdateOutbox(
          row.id,
          {
            status: OutboxStatus.published,
            publishedAt: new Date(),
            lastError: null,
          },
          "mark-published"
        );
        if (markedPublished) {
          this.metrics.publishSuccessTotal.inc();
        } else {
          await this.tryDeadLetterFallback(
            row.id,
            "Published to broker, but failed to persist published state"
          );
        }
      } catch (err) {
        this.metrics.publishFailedTotal.inc();

        // Race mitigation: if broker publish happened but persistence failed afterwards,
        // keep this row out of pending to avoid duplicate publish.
        if (publishedToBroker) {
          const reason = `Published to broker, but failed to persist final state: ${err instanceof Error ? err.message : String(err)}`;
          const deadLettered = await this.tryUpdateOutbox(
            row.id,
            {
              status: OutboxStatus.dead_letter,
              exhaustedAt: new Date(),
              lastError: reason,
            },
            "published-then-failed"
          );
          if (deadLettered) {
            this.metrics.deadLetterTotal.inc();
          } else {
            await this.tryDeadLetterFallback(row.id, reason);
          }
          logger.warn(
            { err, outboxId: row.id, eventName: row.eventName },
            "Outbox relay publish succeeded but persistence failed; moved to dead-letter to prevent duplicate publish"
          );
          continue;
        }

        const nextRetryCount = (row.retryCount ?? 0) + 1;
        if (nextRetryCount >= this.maxRetries) {
          const reason = err instanceof Error ? err.message : String(err);
          const deadLettered = await this.tryUpdateOutbox(
            row.id,
            {
              status: OutboxStatus.dead_letter,
              retryCount: nextRetryCount,
              lastError: reason,
              exhaustedAt: new Date(),
            },
            "max-retries"
          );
          if (deadLettered) {
            this.metrics.deadLetterTotal.inc();
          } else {
            await this.tryDeadLetterFallback(row.id, `max-retries-update-failed: ${reason}`);
          }
          logger.warn(
            { err, outboxId: row.id, eventName: row.eventName, retryCount: nextRetryCount, maxRetries: this.maxRetries },
            "Outbox relay max retries reached; row moved to dead-letter"
          );
          continue;
        }

        this.metrics.retriesTotal.inc();
        const retryReason = err instanceof Error ? err.message : String(err);
        const rescheduled = await this.tryUpdateOutbox(
          row.id,
          {
            status: OutboxStatus.pending,
            retryCount: nextRetryCount,
            lastError: retryReason,
          },
          "reschedule-retry"
        );
        if (!rescheduled) {
          await this.tryDeadLetterFallback(row.id, `retry-reschedule-failed: ${retryReason}`);
        }
        logger.warn(
          { err, outboxId: row.id, eventName: row.eventName, retryCount: nextRetryCount, maxRetries: this.maxRetries },
          "Outbox relay publish/parse failed; row scheduled for retry"
        );
      }
    }
  }

  start(intervalMs: number = DEFAULT_INTERVAL_MS): void {
    if (this.timeoutId != null) return;
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
    logger.info({ intervalMs }, "Integration outbox relay started");
  }

  stop(): void {
    this.stopped = true;
    if (this.timeoutId != null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
      logger.info("Integration outbox relay stopped");
    }
  }
}

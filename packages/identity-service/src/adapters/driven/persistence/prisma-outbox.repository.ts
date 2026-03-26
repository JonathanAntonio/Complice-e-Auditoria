import { randomUUID } from "crypto";
import { PrismaClient, type Prisma } from "../../../../generated/prisma-client";
import type { IOutboxRepository } from "../../../application/ports/outbox-repository.port";
import type { OutboxEvent } from "../../../application/ports/outbox-writer.port";

export class PrismaOutboxRepository implements IOutboxRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(event: OutboxEvent, transactionClient?: Prisma.TransactionClient): Promise<void> {
    const db = transactionClient ?? this.prisma;
    await db.outboxModel.create({
      data: {
        id: randomUUID(),
        eventName: event.eventName,
        payload: event.payload as object,
        createdAt: new Date(),
      },
    });
  }
}

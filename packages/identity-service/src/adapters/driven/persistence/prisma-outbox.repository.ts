import { randomUUID } from "crypto";
import { PrismaClient, type Prisma } from "../../../../generated/prisma-client";
import type { IOutboxRepository } from "../../../application/ports";
import type { OutboxEvent } from "../../../application/ports";
import { toEnvelope } from "./outbox-envelope";

export class PrismaOutboxRepository implements IOutboxRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(event: OutboxEvent, transactionClient?: Prisma.TransactionClient): Promise<void> {
    const db = transactionClient ?? this.prisma;
    const envelope = toEnvelope(event);
    await db.outboxModel.create({
      data: {
        id: randomUUID(),
        eventName: event.eventName,
        payload: envelope as object,
        createdAt: new Date(),
      },
    });
  }
}

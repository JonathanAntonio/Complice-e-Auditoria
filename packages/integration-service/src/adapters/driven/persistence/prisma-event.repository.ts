import { randomUUID } from "crypto";
import { Prisma, PrismaClient } from "../../../../generated/prisma-client";
import {
  EXCHANGE_USER_EVENTS,
  routingKeyFromEventType,
  type EventEnvelopeV1,
} from "@lframework/shared";

function isPrismaP2002(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

export class PrismaEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async storeInboundAndOutbox(envelope: EventEnvelopeV1): Promise<{ duplicate: boolean }> {
    try {
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.inboundEventModel.create({
          data: {
            eventId: envelope.eventId,
            eventType: envelope.type,
            producer: envelope.producer,
            correlationId: envelope.correlationId,
            occurredAtUTC: new Date(envelope.occurredAtUTC),
            version: envelope.version,
            payload: envelope.payload as Prisma.InputJsonValue,
            receivedAt: new Date(),
          },
        });

        await tx.outboxModel.create({
          data: {
            id: randomUUID(),
            eventName: envelope.type,
            exchange: EXCHANGE_USER_EVENTS,
            routingKey: routingKeyFromEventType(envelope.type),
            payload: envelope as unknown as Prisma.InputJsonValue,
            retryCount: 0,
            lastError: null,
            createdAt: new Date(),
          },
        });
      });
      return { duplicate: false };
    } catch (err) {
      if (isPrismaP2002(err)) {
        return { duplicate: true };
      }
      throw err;
    }
  }
}

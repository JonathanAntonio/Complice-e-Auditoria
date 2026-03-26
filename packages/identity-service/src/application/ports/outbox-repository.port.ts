import type { OutboxEvent } from "./outbox-writer.port";
import type { Prisma } from "../../../generated/prisma-client";

export interface IOutboxRepository {
  append(event: OutboxEvent, transactionClient?: Prisma.TransactionClient): Promise<void>;
}

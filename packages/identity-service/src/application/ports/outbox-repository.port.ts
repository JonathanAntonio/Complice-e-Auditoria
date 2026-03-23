import type { OutboxEvent } from "./outbox-writer.port";

export interface IOutboxRepository {
  append(event: OutboxEvent): Promise<void>;
}

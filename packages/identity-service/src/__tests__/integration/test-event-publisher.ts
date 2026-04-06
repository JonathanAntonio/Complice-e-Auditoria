import type { TestEventPublisher } from "../../container";

/**
 * No-op event publisher for integration tests so RabbitMQ is not required.
 */
export function createNoOpEventPublisher(): TestEventPublisher {
  return {
    publish: async (_envelope) => {},
    connect: async () => {},
    disconnect: async () => {},
  };
}

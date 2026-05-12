---
name: rabbitmq-expert
description: Expertise in designing and implementing RabbitMQ messaging patterns (Pub/Sub, Worker Queues) in microservices.
---
# RabbitMQ Expert

Use this skill to design reliable messaging systems.

## Patterns
- **Worker Queues**: Distribute time-consuming tasks among multiple workers.
- **Publish/Subscribe**: Broadcast events to multiple services (e.g., `UserCreated` event).
- **Routing**: Direct messages to specific queues based on routing keys.

## Implementation Guidelines
- Use the `amqplib` library.
- Ensure proper connection management (reconnect logic).
- Use `topic` or `direct` exchanges for maximum flexibility.
- Implement DLQ (Dead Letter Queues) for failed messages.

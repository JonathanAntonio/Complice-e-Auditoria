---
name: hexagonal-architecture
description: Guidance for implementing and validating Hexagonal Architecture (Ports and Adapters) in TypeScript. Use when creating new modules, refactoring, or ensuring domain isolation.
---
# Hexagonal Architecture (Ports and Adapters)

This skill helps you maintain Hexagonal Architecture principles in the project.

## Core Principles
1. **Dependency Direction**: Infrastructure and application layers depend on the Domain. The Domain never depends on anything else.
2. **Ports**: Interfaces defined in the `application/ports` or `domain` layer.
3. **Adapters**:
    - **Driving (Input)**: Controllers, CLI commands, Event listeners (in `src/adapters/driving`).
    - **Driven (Output)**: Repositories, External API clients, Message brokers (in `src/adapters/driven`).

## Folder Structure
- `src/domain`: Entities, Value Objects, Domain Services, and Domain Exceptions.
- `src/application`: Use Cases, DTOs, and Port interfaces.
- `src/adapters/driving`: REST Controllers, GQL Resolvers, RabbitMQ consumers.
- `src/adapters/driven`: Prisma repositories, Redis caches, HTTP clients.

## Verification
- Ensure `src/domain` has NO dependencies on `express`, `prisma`, or external libraries (except basic utilities).
- Use Cases should orchestrate Domain objects and call Ports.

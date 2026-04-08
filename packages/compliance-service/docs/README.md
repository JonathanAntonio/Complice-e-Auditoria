# Compliance Service

Microserviço de **compliance**: violações (listagem/criação), cache Redis e consumo do evento `user.created` (replicação local de usuário).

## Structure (summary)

- **domain/** — `Item` (representação atual de violação), value objects (e.g. Money), tipos de domínio. Sem interfaces de I/O.
- **application/** — use cases (`create-item`, `list-items`, `handle-user-created`), **all ports** (repositório, invalidador de cache, consumidor de eventos), DTOs.
- **adapters/** — **Driving:** HTTP (controller, validação, rotas), messaging (RabbitMQ UserCreated consumer). **Driven:** persistence (Prisma), cache invalidator, auth (JWT from shared).

Composition root: `src/container.ts`. Entry: `src/index.ts`.

## Where to find things

| What | Where |
|------|-------|
| Entities and value objects | `src/domain/entities/`, `src/domain/value-objects/` |
| Repository and other ports | `src/application/ports/` |
| Use cases | `src/application/use-cases/` |
| DTOs | `src/application/dtos/` |
| Routes and controllers | `src/adapters/driving/http/` (routes.ts, item.controller, item.validation) |
| Persistence | `src/adapters/driven/persistence/` |
| UserCreated consumer | `src/adapters/driving/messaging/rabbitmq-user-created.consumer.ts` |
| Composition root | `src/container.ts` |

## Documentação geral

- [Visao Geral](../../../docs/VisaoGeralProjeto.md) — arquitetura e fluxo do sistema
- [Requisitos Corporativos](../../../docs/RequisitosCorp.md) — requisitos funcionais e não funcionais
- [Regras de Negócio](../../../docs/RegrasDeNegocio.md) — regras de compliance e autorização

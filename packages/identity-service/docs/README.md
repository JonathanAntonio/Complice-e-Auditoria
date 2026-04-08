# Identity Service

Microserviço de **identidade**: usuários, autenticação OAuth (Google/GitHub), JWT e publicação do evento `user.created`.

## Structure (summary)

- **domain/** — `User`, value objects (e.g. Email), domain types (e.g. OAuthProvider). No I/O interfaces.
- **application/** — Use cases (oauth-callback, logout, get-current-user, create-user, get-user-by-id), **all ports** (repositories, token, cache, event publisher, OAuth provider), DTOs (create-user, user-auth-profile, oauth-callback-query).
- **adapters/** — **Driving:** HTTP (auth, user controllers, routes), **Driven:** persistence (Prisma), messaging (RabbitMQ publisher), notifiers, auth (JWT, Google/GitHub OAuth).

Composition root: `src/container.ts`. Entry: `src/index.ts`.

## Where to find things

| What | Where |
|------|-------|
| Entities and value objects | `src/domain/entities/`, `src/domain/value-objects/` |
| Repository and other ports | `src/application/ports/` |
| Use cases | `src/application/use-cases/` |
| DTOs (input/output, errors) | `src/application/dtos/` |
| Routes and controllers | `src/adapters/driving/http/` (auth.routes, auth.controller, user.controller, routes.ts) |
| Persistence | `src/adapters/driven/persistence/` |
| Composition root | `src/container.ts` |

## Documentação geral

- [Visao Geral](../../../docs/VisaoGeralProjeto.md) — arquitetura e fluxo do sistema
- [Requisitos Corporativos](../../../docs/RequisitosCorp.md) — requisitos funcionais e não funcionais
- [Regras de Negócio](../../../docs/RegrasDeNegocio.md) — regras do domínio
- [RBAC Roadmap](../../../docs/RBAC-IDENTITY-ROADMAP.md) — plano detalhado para evoluir o `identity-service` de role única para RBAC granular

## Observação

Este README referencia apenas documentos atualmente presentes no repositório.

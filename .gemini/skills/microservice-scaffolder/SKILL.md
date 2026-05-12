---
name: microservice-scaffolder
description: Use this skill when you need to create a new microservice in the monorepo, following the established Clean Architecture pattern.
---
# Microservice Scaffolder

This skill guides you through scaffolding a new microservice in this pnpm monorepo.

## Workflow

When asked to create a new microservice, follow these steps:

1. Create a new directory under `packages/<service-name>`.
2. Create the basic `package.json` with dependencies (express, typescript, prisma). Use an existing service (like `audit-service`) as a reference.
3. Setup `tsconfig.json` extending the shared workspace config.
4. Scaffold the Clean Architecture folders:
   - `src/domain/` (Entities, Value Objects)
   - `src/application/` (Use Cases)
   - `src/adapters/` (Controllers, Repositories)
   - `src/app/` (Framework setup, Express)
5. Create `src/index.ts` to bootstrap the application.
6. Setup `prisma/schema.prisma` if the service needs a database.
7. Run `pnpm install` at the workspace root to link dependencies.

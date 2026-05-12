---
name: monorepo-ops
description: Expertise in managing the pnpm monorepo, Makefile commands, and Docker dev environment.
---
# Monorepo Ops

Manage the development lifecycle of this multi-service project.

## Common Tasks
- **Installation**: `make install` (pnpm install).
- **Infrastructure**: `make infra-up` to start Postgres, Redis, RabbitMQ, and Nginx.
- **Migrations**: `make migrate` to run Prisma migrations across all services.
- **Development**: `make dev` to start all services in watch mode.
- **Testing**: `make test` to run all workspace tests.

## Workspace Strategy
- Use `pnpm --filter <package> <command>` for package-specific actions.
- Shared code lives in `packages/shared`. Remember to rebuild it if changes are made: `pnpm --filter @lframework/shared run build`.

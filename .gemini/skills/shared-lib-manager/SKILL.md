---
name: shared-lib-manager
description: Guidance for maintaining the @lframework/shared package, which contains cross-cutting concerns like DTOs, events, and middleware.
---
# Shared Library Manager

Manage the backbone of the monorepo: `@lframework/shared`.

## Contents
- `src/http`: Common middlewares (Auth, Error handling).
- `src/events`: Domain event definitions used across microservices.
- `src/dtos`: Shared Data Transfer Objects.
- `src/schemas`: Common Zod schemas.
- `src/cache`: Redis wrapper logic.
- `src/errors`: Standardized Exception classes.

## Workflow
1. **Making Changes**: Edit files in `packages/shared/src`.
2. **Rebuilding**: Run `pnpm --filter @lframework/shared run build`. This is mandatory for other services to "see" the changes.
3. **Adding dependencies**: Add them to `packages/shared/package.json` and run `pnpm install` at the root.

## Guidelines
- Keep the shared library thin. Only add truly cross-cutting code.
- Ensure high test coverage for shared logic in `src/test`.

# Project Memory: Complice e Auditoria (CA)

## Project Overview
A corporate monorepo platform for compliance and auditing using microservices architecture, RabbitMQ messaging, PostgreSQL, Redis, and React frontend.

## Architectural Decisions & Stack
- **Languages/Tools:** Node.js, TypeScript, pnpm workspaces, Nginx (dev gateway), Prisma.
- **Database:** PostgreSQL (structured transactional data) and RabbitMQ (asynchronous communication).
- **Frontend:** React + Vite.

## Active Task
- **Goal:** Expose integration routes for external systems and keep Swagger up to date.
- **Current Step:** Completed implementation of proxy integration endpoints and updated OpenAPI specifications.

## Milestones & Status
- [x] Initial codebase discovery and structure analysis.
- [x] Plugin/Integration research and proposal.
- [x] Expose integration proxy endpoints in integration-service (compliance, risk, audit).
- [x] Implement API Key verification and signed JWT token service-to-service auth.
- [x] Update integration OpenAPI specification and Nginx gateway exposures.
- [x] Fix flaky notification-service test.

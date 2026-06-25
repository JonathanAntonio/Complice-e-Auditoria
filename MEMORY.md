# Project Memory: Complice e Auditoria (CA)

## Project Overview
A corporate monorepo platform for compliance and auditing using microservices architecture, RabbitMQ messaging, PostgreSQL, Redis, and React frontend.

## Architectural Decisions & Stack
- **Languages/Tools:** Node.js, TypeScript, pnpm workspaces, Nginx (dev gateway), Prisma.
- **Database:** PostgreSQL (structured transactional data) and RabbitMQ (asynchronous communication).
- **Frontend:** React + Vite.

## Active Task
- **Goal:** Fix the corrupted PDF report export download.
- **Current Step:** Completed. Replaced the corrupted plain text output with a professional corporate PDF layout containing styled header banners, dividing lines, metadata grids, verification details, and disclaimer footers, fully compliant with the standard PDF specifications. Additionally, implemented data-driven exporting in both CSV and PDF formats: matching records are now queried, filtered by scope and criteria (period, area, risk level, etc.), and dynamically rendered as rows (in CSV) and a structured table (in PDF). All unit tests have been updated and are passing successfully.

## Milestones & Status
- [x] Initial codebase discovery and structure analysis.
- [x] Plugin/Integration research and proposal.
- [x] Expose integration proxy endpoints in integration-service (compliance, risk, audit).
- [x] Implement API Key verification and signed JWT token service-to-service auth.
- [x] Update integration OpenAPI specification and Nginx gateway exposures.
- [x] Fix flaky notification-service test.
- [x] Create modular LaTeX TCC documentation and chapters.
- [x] Fix Google Login 401 Unauthorized errors caused by race conditions / duplicate OAuth exchange codes and React StrictMode double effects.
- [x] Set all database users as administrators (role-administrador) and increment authorization versions.
- [x] Update DEFAULT_USER_ROLE in identity-service domain types to default new users to administrador, and adjust unit tests.
- [x] Fix corrupted PDF report exports by generating a structurally valid PDF document.



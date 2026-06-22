# Project Memory: Complice e Auditoria (CA)

## Project Overview
A corporate monorepo platform for compliance and auditing using microservices architecture, RabbitMQ messaging, PostgreSQL, Redis, and React frontend.

## Architectural Decisions & Stack
- **Languages/Tools:** Node.js, TypeScript, pnpm workspaces, Nginx (dev gateway), Prisma.
- **Database:** PostgreSQL (structured transactional data) and RabbitMQ (asynchronous communication).
- **Frontend:** React + Vite.

## Active Task
- **Goal:** Create and structure the TCC academic monograph in LaTeX.
- **Current Step:** Created the main LaTeX file (`main.tex`) and modular chapter files (`capitulos/1_introducao.tex` to `6_manual_usuario.tex`).

## Milestones & Status
- [x] Initial codebase discovery and structure analysis.
- [x] Plugin/Integration research and proposal.
- [x] Expose integration proxy endpoints in integration-service (compliance, risk, audit).
- [x] Implement API Key verification and signed JWT token service-to-service auth.
- [x] Update integration OpenAPI specification and Nginx gateway exposures.
- [x] Fix flaky notification-service test.
- [x] Create modular LaTeX TCC documentation and chapters.

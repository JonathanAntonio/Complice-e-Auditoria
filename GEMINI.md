# Workspace Guidelines: Complice e Auditoria (CA)

## Codebase Structure
- **Monorepo:** Controlled by `pnpm` workspaces.
- **Services:** Found under `packages/`.
  - `audit-service`: Logs ingestion, Postgres database.
  - `compliance-service`: Rule engine.
  - `risk-analysis-service`: Risk scoring.
  - `reporting-service`: Reporting and export.
  - `integration-service`: Ingestion gate, API key checks, RabbitMQ publishing.
  - `frontend`: React + Vite web dashboard.
- **Configuration & Build:** Managed using `Makefile` and `pnpm-workspace.yaml`.

## Engineering Protocols
1. **Agentic TDD:** Write test scripts to validate changes before implementation.
2. **Leaf Node Pattern:** Decompose large modules into simple single-responsibility files.
3. **Security First:** Verify inputs, handle credentials securely, prevent injection, apply OWASP standard.
4. **Communication & Logs:** Use English for logs, comments, and architectural files. Match the user's language (Portuguese or English) in the chat.

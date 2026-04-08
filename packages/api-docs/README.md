# API Docs

Serviço agregador de documentação OpenAPI dos microservices.

- **Porta HTTP:** 3000 (ou variável de configuração do pacote)
- **Rotas principais:** `/api-docs`, `/api-docs.json`, `/openapi.json`

## Objetivo

- Consolidar specs de `identity-service`, `compliance-service`, `integration-service` e `audit-service`.
- Expor documentação única para inspeção e testes manuais.

## Rodar e testar

```bash
pnpm --filter api-docs dev
pnpm --filter api-docs test
```

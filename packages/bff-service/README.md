# BFF Service

Backend for Frontend responsável por sessão HttpOnly e orquestração entre frontend e serviços internos.

- **Porta HTTP:** 3004 (ou `BFF_PORT`)
- **Roteamento:** `/bff/auth/*`, `/bff/compliance/violations`, `/bff/audit/logs`, `/health`
- **Roteamento adicional v1:** `/bff/risk/scores`, `/bff/reports/exports`, `/bff/notifications/*`

## Variáveis de ambiente principais

- `BFF_GATEWAY_URL` — URL do gateway (padrão: `http://localhost:8080`)
- `BFF_IAM_AUTH_BASE_PATH` — base path para auth no gateway (padrão: `/identity/api/v1/auth`)
- `BFF_COMPLIANCE_BASE_PATH` — base path para compliance no gateway (padrão: `/compliance/api/v1`)
- `BFF_AUDIT_BASE_PATH` — base path para auditoria no gateway (padrão: `/audit/api/v1`)
- `BFF_RISK_BASE_PATH` — base path para risco no gateway (padrão: `/risk/api/v1`)
- `BFF_REPORTING_BASE_PATH` — base path para reporting no gateway (padrão: `/reporting/api/v1`)
- `BFF_NOTIFICATION_BASE_PATH` — base path para notification no gateway (padrão: `/notification/api/v1`)
- `BFF_INTEGRATION_BASE_PATH` — base path para integration no gateway (padrão: `/integration/api/v1`)
- `BFF_INTEGRATION_API_KEY` — API key usada para publicar eventos auditáveis no integration-service
- `BFF_PUBLIC_BASE_URL` — URL pública usada em callbacks OAuth (opcional)
- `BFF_SESSION_COOKIE_NAME`
- `BFF_SESSION_MAX_AGE_SECONDS`

## Rodar e testar

```bash
pnpm --filter bff-service dev
pnpm --filter bff-service test
```

## Fluxo principal

1. Frontend inicia OAuth via `/bff/auth/google/start` ou `/bff/auth/github/start`.
2. Callback grava token em cookie HttpOnly.
3. Frontend consome sessão em `/bff/auth/me`.
4. Frontend consome violações via `/bff/compliance/violations`.
5. Frontend consulta trilha de auditoria via `/bff/audit/logs`.
6. Frontend consulta risco via `/bff/risk/scores`.
7. Frontend dispara exportações via `/bff/reports/exports`.
8. Frontend dispara notificações via `/bff/notifications/dispatch`.
9. BFF publica trilha auditável de exportações/notificações via `integration-service`.

Erros de upstream são traduzidos para respostas estáveis (`401`, `403`, `502`) para melhorar UX no frontend.

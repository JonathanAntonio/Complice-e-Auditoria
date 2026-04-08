# BFF Service

Backend for Frontend responsável por sessão HttpOnly e orquestração entre frontend e serviços internos.

- **Porta HTTP:** 3004 (ou `BFF_PORT`)
- **Roteamento:** `/bff/auth/*`, `/bff/compliance/violations`, `/bff/audit/logs`, `/health`

## Variáveis de ambiente principais

- `BFF_GATEWAY_URL` — URL do gateway (padrão: `http://localhost:8080`)
- `BFF_IAM_AUTH_BASE_PATH` — base path para auth no gateway (padrão: `/identity/api/auth`)
- `BFF_COMPLIANCE_BASE_PATH` — base path para compliance no gateway (padrão: `/compliance/api`)
- `BFF_AUDIT_BASE_PATH` — base path para auditoria no gateway (padrão: `/audit/api`)
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

Erros de upstream são traduzidos para respostas estáveis (`401`, `403`, `502`) para melhorar UX no frontend.

# Frontend

Aplicação React (Vite + Ant Design) consumindo somente o BFF.

- **Porta padrão:** 5173
- **Base de integração:** `/bff/auth/*`, `/bff/compliance/violations` e `/bff/audit/logs`

## Rodar e testar

```bash
pnpm --filter frontend dev
pnpm --filter frontend test
```

## Fluxos implementados

- Login OAuth (Google/GitHub) via BFF.
- Leitura de sessão atual (`/bff/auth/me`).
- Listagem de violações de compliance.
- Criação de violação de compliance.
- Timeline de atividade com logs reais de auditoria.
- Tratamento de erro para `401` (não autenticado), `403` (sem permissão) e indisponibilidade de serviço.

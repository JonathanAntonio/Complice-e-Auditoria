# Audit Service

Microserviço de auditoria para trilha imutável de eventos, com consumo via RabbitMQ e leitura protegida por RBAC.

- **Porta HTTP:** 3005 (ou `AUDIT_SERVICE_PORT`)
- **Rotas:** `/api/audit/logs`, `/api-docs`, `/health`

## Variáveis principais

- `AUDIT_DATABASE_URL`
- `RABBITMQ_URL`
- `JWT_SECRET`
- `AUDIT_BASE_URL`

## Rodar

```bash
pnpm --filter audit-service dev
pnpm --filter audit-service prisma:generate
```

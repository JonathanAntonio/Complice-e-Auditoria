# Integration Service

Microserviço de integração para ingestão de eventos externos com autenticação por API key, idempotência e publicação assíncrona via outbox.

- **Porta HTTP:** 3003 (ou `INTEGRATION_SERVICE_PORT`)
- **Roteamento:** `/api/integrations/events`, `/metrics`, `/health`

## Variáveis de ambiente obrigatórias

- `INTEGRATION_DATABASE_URL` — PostgreSQL
- `RABBITMQ_URL` — RabbitMQ
- `INTEGRATION_API_KEY` — chave para ingestão de eventos

## Rodar e testar

```bash
pnpm --filter integration-service dev
pnpm --filter integration-service test
```

## Comportamento esperado

- `POST /api/integrations/events`
  - `401` para API key inválida/ausente
  - `400` para envelope inválido
  - `202` para evento aceito
  - `200` para evento duplicado (idempotência)
- Outbox relay publica eventos no RabbitMQ em background.
- O serviço também publica eventos de auditoria (`integration.audit.*`) para rastrear ingestões aceitas, duplicadas e rejeitadas.

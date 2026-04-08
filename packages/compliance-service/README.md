# Compliance Service

Microserviço de compliance: gestão de violações, cache Redis e consumo do evento `user.created` via RabbitMQ.

- **Porta HTTP:** 3002 (ou `COMPLIANCE_SERVICE_PORT`)
- **Roteamento:** `/api` (violations); `/health`

## Variáveis de ambiente obrigatórias (produção)

- `COMPLIANCE_DATABASE_URL` — PostgreSQL
- `REDIS_URL` — Redis (cache de listagem)
- `RABBITMQ_URL` — RabbitMQ (UserCreated)
- `JWT_SECRET` — ≥ 32 caracteres (validação de tokens emitidos pelo identity-service)

## Rodar e testar

```bash
pnpm run dev   # http://localhost:3002
pnpm test      # Vitest (use cases, DTOs)
```

## Layers (Hexagonal + DDD)

- **domain/** — entidade de violação, value objects e tipos de domínio (sem I/O)
- **application/** — use cases (listar/criar violações, replicação de usuário), ports e DTOs
- **adapters/** — Driving: HTTP (Express), RabbitMQ consumer. Driven: Prisma, Redis cache invalidator

Ver [README raiz](../../README.md), [docs/RequisitosCorp.md](../../docs/RequisitosCorp.md) e [docs/RegrasDeNegocio.md](../../docs/RegrasDeNegocio.md).

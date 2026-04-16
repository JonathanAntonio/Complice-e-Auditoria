# Complice e Auditoria (CA)

Monorepo de uma plataforma corporativa de **compliance e auditoria** com arquitetura de microsserviços, mensageria e frontend web.

## Visão Geral

O projeto cobre fluxos de:
- auditoria de eventos
- compliance e retenção
- análise de risco
- notificações
- integração com sistemas externos
- geração de relatórios
- gateway/BFF para frontend

Stack principal:
- Node.js + TypeScript
- pnpm workspace
- PostgreSQL, Redis e RabbitMQ (Docker)
- Nginx (gateway de desenvolvimento)
- Prisma
- Vite + React (frontend)

## Estrutura do Monorepo

```text
packages/
  api-docs/
  audit-service/
  bff-service/
  compliance-service/
  frontend/
  identity-service/
  integration-service/
  notification-service/
  reporting-service/
  risk-analysis-service/
  shared/
```

## Pré-requisitos

- Node.js 18+
- pnpm 9+
- Docker + Docker Compose
- (Opcional) `make` para Linux/macOS
- (Opcional) PowerShell para usar `make.ps1` no Windows

## Primeiros Passos

### Linux/macOS

```bash
make run
```

Esse comando executa:
1. instalação de dependências
2. subida da infraestrutura Docker
3. espera de healthcheck
4. inicialização dos serviços em modo dev

### Windows

Use o script que substitui o `Makefile`:

```powershell
.\make.cmd run
```

Comandos equivalentes também funcionam, por exemplo:

```powershell
.\make.cmd install
.\make.cmd infra-up
.\make.cmd infra-wait
.\make.cmd dev
```

## Comandos Principais

### Com `make` (Linux/macOS)

```bash
make help
make install
make infra-up
make infra-wait
make infra-down
make migrate
make dev
make run
make test
make lint
make build
make ngrok
```

### Com `make.cmd` (Windows)

```powershell
.\make.cmd help
.\make.cmd install
.\make.cmd infra-up
.\make.cmd infra-wait
.\make.cmd infra-down
.\make.cmd migrate
.\make.cmd dev
.\make.cmd run
.\make.cmd test
.\make.cmd lint
.\make.cmd build
.\make.cmd ngrok
```

## Infraestrutura Local (Docker)

O `docker-compose.yml` sobe:
- `lframework-postgres`
- `lframework-redis`
- `lframework-rabbitmq`
- `lframework-nginx`

Portas padrão:
- PostgreSQL: `5432`
- Redis: `6379`
- RabbitMQ AMQP: `5672`
- RabbitMQ Management: `15672`
- Nginx gateway: `8080`

## Migrações

O alvo `migrate` executa Prisma migrations para:
- `identity-service`
- `compliance-service`
- `integration-service`
- `audit-service`

## Testes e Qualidade

```bash
pnpm test
pnpm lint
pnpm build
pnpm test:e2e
```

## Documentação Adicional

- Visão funcional e arquitetural: `docs/VisaoGeralProjeto.md`
- Runbook operacional: `docs/RunbookOperacaoSLO.md`
- Diagramas: `docs/diagramas/`

## Observações

- O comando `dev` inicia múltiplos serviços em paralelo.
- O alvo `ngrok` já está configurado para este projeto.
- Se algum serviço falhar ao subir, confira logs locais e status dos containers com `docker ps`.

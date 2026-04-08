# LFramework

Framework de referência em TypeScript para projetos com **DDD**, **Arquitetura Hexagonal** e **Microserviços**. Pensado para escalar: monorepo, convenções fixas e núcleo compartilhado (`@lframework/shared`) com formato de erro, validação e schemas comuns.

## Stack

- **TypeScript** (strict)
- **Monorepo** (pnpm workspaces)
- **PostgreSQL** (Prisma)
- **Redis** (cache)
- **RabbitMQ** (eventos entre serviços)
- **Express** (API HTTP)
- **Nginx** (API Gateway em Docker)

## Estrutura do repositório

```
LFramework/
├── packages/
│   ├── frontend/           # Frontend React (Vite) consumindo apenas o BFF
│   ├── bff-service/        # Backend for Frontend (sessão HttpOnly + OAuth callback)
│   ├── shared/             # Núcleo do framework: eventos, DTOs, HTTP helpers, schemas
│   ├── identity-service/   # Microserviço de identidade (auth, usuários)
│   ├── compliance-service/    # Microserviço de compliance (violações)
│   ├── integration-service/# Microserviço de integrações (ingestão de eventos)
│   ├── audit-service/      # Microserviço de auditoria (trilha de eventos)
│   └── api-docs/           # Swagger unificado (identity + compliance + integration + audit)
├── nginx/
│   └── nginx.conf          # API Gateway (proxy reverso)
├── ngrok.yml               # Túnel público único para frontend (entrada do sistema)
├── docker-compose.yml      # Postgres, Redis, RabbitMQ, Nginx
└── docs/                   # Documentação
```

Cada serviço segue **hexagonal + DDD**: `domain/`, `application/`, `adapters/` (driving/driven) e composição no `container`.

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [docs/VisaoGeralProjeto.md](docs/VisaoGeralProjeto.md) | Visão da arquitetura, fluxo orientado a eventos e componentes |
| [docs/RequisitosCorp.md](docs/RequisitosCorp.md) | Requisitos corporativos funcionais e não funcionais |
| [docs/RegrasDeNegocio.md](docs/RegrasDeNegocio.md) | Regras de negócio do domínio (RN-XXX) |
| [docs/AnaliseRequisitos.md](docs/AnaliseRequisitos.md) | Priorização RF/RNF, stakeholders, casos de uso e riscos |
| [docs/RBAC-IDENTITY-ROADMAP.md](docs/RBAC-IDENTITY-ROADMAP.md) | Evolução de autorização granular no identity-service |
| [docs/CRONOGRAMA-1-MES.md](docs/CRONOGRAMA-1-MES.md) | Plano de execução por etapas |
| [docs/DDE Jonathan.md](docs/DDE Jonathan.md) | Documento detalhado do projeto |

## Como rodar

```bash
cp .env.example .env
pnpm install
pnpm docker:up
```

Migrações (uma vez):

```bash
pnpm --filter identity-service exec prisma migrate dev --name init --schema=./prisma/schema.prisma
pnpm --filter compliance-service exec prisma migrate dev --name init --schema=./prisma/schema.prisma
pnpm --filter integration-service exec prisma migrate dev --name init --schema=./prisma/schema.prisma
pnpm --filter audit-service exec prisma migrate dev --name init --schema=./prisma/schema.prisma
```

As migrações de cada serviço ficam em `packages/<service>/prisma/migrations`.

Serviços (em terminais separados ou ambos de uma vez):

```bash
pnpm dev:identity   # http://localhost:3001
pnpm dev:compliance    # http://localhost:3002
pnpm dev:integration # http://localhost:3003
pnpm dev:audit      # http://localhost:3005
pnpm dev:api-docs   # http://localhost:3000
pnpm dev:bff        # http://localhost:3004
pnpm dev:frontend   # http://localhost:5173 (React + Vite)
# ou: pnpm dev       # sobe todos
```

Com o gateway: **http://localhost:8080** (prefixos `/identity/`, `/compliance/`, `/integration/`, `/audit/` e Swagger unificado em `/api-docs/`).
No frontend não há chamada direta para o gateway: todo tráfego de autenticação passa por `/bff/auth/*`.
No frontend, use chamadas para **`/bff/auth/*`**. O BFF mantém sessão em cookie HttpOnly e conversa com IAM/Gateway internamente.
Fluxo OAuth no frontend (entrada única): `/bff/auth/google/start`, `/bff/auth/github/start`, `/bff/auth/me` e `/bff/auth/logout`.
Para dados protegidos de compliance via sessão HttpOnly, use `/bff/compliance/violations` (`GET` listagem e `POST` criação).
Para logs de auditoria via sessão HttpOnly, use `/bff/audit/logs` (`GET` paginado).

## Ngrok (webhooks e demo)

Arquivo de config: `ngrok.yml` na raiz.

Pré-requisito: o `ngrok.yml` usa `NGROK_AUTHTOKEN` no ambiente.
Obtenha seu token em:
`https://dashboard.ngrok.com/get-started/your-authtoken`

Defina a variável antes de iniciar:

```bash
export NGROK_AUTHTOKEN=seu_token
```

```bash
ngrok start --all --config ./ngrok.yml
```

Modelo recomendado para OAuth com um único túnel externo:
- Expor apenas o frontend (Vite) por ngrok.
- Configurar `BFF_PUBLIC_BASE_URL` para `https://<seu-dominio-ngrok>`.
- Configurar `BASE_URL` para `https://<seu-dominio-ngrok>/identity`.

## Testes

```bash
pnpm test
```

Roda Vitest em todos os pacotes (use cases, DTOs, controllers) e smoke tests das rotas de documentação (`/api-docs.json`, `/api-docs`, `/openapi.json`, `/`).

## Padrões

Ports & Adapters (Hexagonal), Repository, Inversão de dependência, DDD (entidade, value object, domain event), Use case, DTO, Publish-Subscribe (RabbitMQ). O shared expõe contrato de erro (`ErrorResponseDto`), helpers HTTP (`sendError`, `sendValidationError`) e schemas comuns (ex.: `nameSchema`) para manter consistência entre serviços à medida que o projeto escala.

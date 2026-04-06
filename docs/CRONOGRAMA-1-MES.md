# Cronograma do Projeto (1 Mês) — Implementação (Compliance e Auditoria)

Este cronograma **não depende** do código-base do repositório (que você baixou como template). Ele foi montado a partir dos documentos de requisitos e arquitetura em `docs/` e assume apenas as decisões macro do domínio: microsserviços, mensageria, trilha de auditoria imutável, compliance/risco/relatórios e LGPD.

## Premissas

- Duração: 1 mês (22 dias úteis)
- Jornada diária: 8 horas
- Objetivo: entregar um **MVP funcional** (rodando localmente com Docker) com fluxo ponta a ponta
- Cada dia termina com: feature testável + registro do “como validar” (comandos/curl) + ajuste de docs de API/eventos
- Stack (a mesma do template): **TypeScript (strict)** + **Express**, **Prisma** + **PostgreSQL**, **Redis**, **RabbitMQ**, **Nginx** (gateway), testes com **Vitest/Supertest**
- Convenção: timestamps em **UTC** no backend; UI converte para o fuso do usuário

## Período (opcional)

- Início (Dia 1): `AAAA-MM-DD`
- Fim (Dia 22): `AAAA-MM-DD`

## Roadmap (MVP -> V1)

**MVP (neste mês):**

1. Integração de entrada (webhook/API) recebendo eventos externos e publicando em mensageria
2. Auditoria imutável (append-only) registrando todos os eventos relevantes
3. Compliance Engine aplicando regras e gerando violações + workflow mínimo
4. Notificações básicas (pelo menos 1 canal) com retries
5. Reporting básico (KPIs e export simples)

**V1 (depois do mês):**

- Catálogo completo de regras/DSL, UI de dashboard mais rica, relatórios avançados, integrações específicas por ERP, ML no Risk Analysis, HA/observabilidade completa.
- Se você quiser seguir o desenho “PostgreSQL + MongoDB” dos docs, a migração do armazenamento de auditoria para **MongoDB** pode entrar aqui (MVP pode ficar em PostgreSQL com JSONB + append-only).

## Serviços do MVP (baseado nos docs)

- **Identity Service**: autenticação e RBAC (papéis) + auditoria de acesso
- **Integration Service**: recebe eventos externos, valida, garante idempotência e publica na mensageria
- **Audit Service**: consome eventos e persiste trilha imutável (append-only) + API de consulta
- **Compliance Engine**: regras, violações e workflow + eventos de violação
- **Notification Service**: consome eventos de violação e notifica responsáveis
- **Reporting Service**: KPIs e exportações
- **(Opcional no MVP, se sobrar tempo)** Risk Analysis Service: scoring simples

## Definition of Done (para o mês)

- Fluxo e2e funcionando: **evento externo -> mensageria -> audit -> compliance -> notification -> reporting**
- Contratos definidos: APIs (OpenAPI) e eventos (schemas/versões) com exemplos
- Auditoria imutável: sem update/delete de eventos; somente append
- Segurança mínima: autenticação, RBAC, rate limiting nas entradas públicas, mascaramento/cripto de dados sensíveis nos logs
- 1 teste e2e automatizado + suíte mínima de integração por serviço

## Planejamento Semanal

| Semana | Dias | Foco | Resultado esperado |
| --- | ---: | --- | --- |
| 1 | 5 | Fundação | Repo + infra local + padrões + Identity mínimo |
| 2 | 5 | Entrada e Auditoria | Integration recebendo e Audit persistindo trilha imutável |
| 3 | 5 | Compliance e Alertas | Regras + violações + notificações + (scoring opcional) |
| 4 | 5 | Reporting e Qualidade | KPIs + export + hardening + observabilidade + testes |
| 5 | 2 | Estabilização | e2e, correções, pacote final e guia de validação |

## Cronograma Diário (22 dias)

| Dia | Horas | Tasks (programação) | Entregável verificável |
| ---: | ---: | --- | --- |
| 1 | 8h | Fechar escopo do MVP a partir de `docs/AnaliseRequisitos.md` e `docs/RegrasDeNegocio.md`; transformar em backlog (épicos -> histórias) e critérios de aceite | Backlog priorizado + definição do fluxo e2e alvo + checklist de validação |
| 2 | 8h | Setup da stack do template: `pnpm install`, `pnpm docker:up` (PostgreSQL/Redis/RabbitMQ/Nginx), validar portas e healthchecks; criar um “service template” seguindo o padrão do repo (app Express, DI/container, `/health`, middleware de requestId/log, OpenAPI `/api-docs.json`, testes com supertest) | Infra local em pé + template de microsserviço pronto (copiável) + comandos de validação (curl) |
| 3 | 8h | Identity: autenticação (JWT/OAuth2), RBAC (papéis do doc), políticas básicas (bloqueio por tentativas), endpoints mínimos | Login funcionando + RBAC aplicado em 1 endpoint sensível + logs de acesso auditáveis |
| 4 | 8h | Identity: gestão de usuários/roles e integração com auditoria (registrar login/logout/bloqueio/alterações) | CRUD mínimo de usuário/papel + eventos/registro de auditoria para ações críticas |
| 5 | 8h | Definir e implementar “Event Envelope” (eventId, type, occurredAtUTC, producer, correlationId, payload, version) + utilitários para publish/consume | Esquema do envelope versionado + exemplo de producer e consumer rodando |
| 6 | 8h | Integration Service: endpoint de entrada (webhook/API) com autenticação, validação e idempotência (chave de evento) | Recebe evento válido, rejeita inválido, não duplica replay e publica na fila |
| 7 | 8h | Integration Service: observabilidade (correlationId), rate limit e tratamento de falhas (retries/outbox se necessário) | Entrada resiliente: falhas tratadas, logs correlacionados, métricas básicas |
| 8 | 8h | Audit Service: consumer principal persistindo em storage imutável (append-only) em **PostgreSQL** (tabela `audit_events` com JSONB + índices) | Mensagem consumida vira evento auditável persistido (sem update/delete) |
| 9 | 8h | Audit Service: API de consulta (paginação, filtros) + retenção/mascaramento de campos sensíveis | `GET` com filtros + política de retenção documentada/implementada (mínimo) |
| 10 | 8h | Compliance Engine: modelar regra (nome, trigger, severidade, status, versão) + CRUD de regras (RBAC) | Regras criadas/ativadas/desativadas com versionamento e auditoria das mudanças |
| 11 | 8h | Compliance Engine: avaliação de regras no consumo de eventos e geração de violações (status inicial) | Violação criada ao disparar regra + evento `violation.created` publicado |
| 12 | 8h | Workflow de violações: transições, aprovações, SLA, trilha auditável das decisões | Endpoints de transição com validações por papel + audit trail das mudanças |
| 13 | 8h | Notification Service: consumo de eventos de violação + 1 canal (e-mail ou webhook) + retries/DLQ | Notificação entregue (ou registrada) com reprocesso e DLQ em falhas persistentes |
| 14 | 8h | Risk Analysis (opcional no MVP): scoring simples por evento/violação + persistência e atualização | Endpoint/consulta de score e atualização automática no pipeline (se entrar no MVP) |
| 15 | 8h | Reporting Service: KPIs mínimos (conformidade %, violações por período, severidade) | `GET /kpis` (ou equivalente) retornando métricas corretas e filtráveis |
| 16 | 8h | Reporting: export simples (CSV) + auditoria de exportação + controle de escopo (RBAC/área) | Export com filtros + registro de quem exportou/quando/filtros/formato |
| 17 | 8h | Contratos: OpenAPI por serviço e catálogo de eventos (schemas, versionamento, exemplos) + testes de contrato básicos | Contratos publicados/validados + checagem automática (lint/validation) |
| 18 | 8h | Testes: integração por serviço (HTTP + DB) e e2e do fluxo principal (entrada -> audit -> compliance -> notification) | 1 teste e2e automatizado + suíte mínima por serviço verde |
| 19 | 8h | Resiliência: backpressure, idempotência no consumer, comportamento em indisponibilidade (mensageria/audit) | Sem duplicidade; falhas previsíveis indo para DLQ; políticas documentadas |
| 20 | 8h | Segurança/LGPD: criptografia/mascaramento, retenção, auditoria de acessos a dados sensíveis, hardening de headers | Checklist mínimo de segurança aplicado + evidências (tests/curl) |
| 21 | 8h | Observabilidade e operação: health checks, métricas, logs, runbook de incidentes e DR (mínimo) | Runbook operacional + dashboards/health endpoints úteis + smoke tests |
| 22 | 8h | Empacotamento: script de demo, guia “como subir e validar”, lista de limitações do MVP e próximos passos | Passo-a-passo reproduzível + pacote final + roadmap pós-MVP |

## Riscos e Mitigação

- Escopo grande: o “corte” é sempre no V1, mantendo o fluxo e2e do MVP.
- Regras complexas: iniciar com motor simples e versionado; expandir DSL depois.
- Duplicidade/eventual consistency: idempotência no producer e no consumer desde o início.

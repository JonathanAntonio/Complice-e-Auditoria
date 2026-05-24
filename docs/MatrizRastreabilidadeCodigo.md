# Matriz de Rastreabilidade de Requisitos x Código

Data de referência: 2026-05-22  
Escopo: microservices atuais (`identity`, `compliance`, `audit`, `integration`, `bff`, `risk-analysis`, `reporting`, `notification`, `api-docs`).

## Resumo Executivo

| Categoria | Status |
|---|---|
| Requisitos centrais de autenticação OAuth/JWT, RBAC, compliance, auditoria e integração REST | Implementado |
| Requisitos novos de risco, exportação e notificação | Implementado (com cobertura unitária + integração em notificação) |
| Requisitos corporativos avançados (sessão única global, retenção legal automatizada, SLO/SLA com métricas formais) | Parcial (baseline OAuth-only sem senha local) |

---

## Funcionais (RFxx em `docs/AnaliseRequisitos.md`)

| ID | Requisito | Status | Evidências no código |
|---|---|---|---|
| RF01 | Cadastro/edição/inativação de usuários | Parcial | `packages/identity-service/src/adapters/driving/http/routes.ts`, `user.controller.ts` |
| RF02 / RF06 | RBAC por perfis/permissões | Implementado | `packages/identity-service/src/domain/types.ts`, `authorization-registry.ts`, `authorization.middleware.ts` |
| RF03 | Autenticação OAuth2/JWT | Implementado | `packages/identity-service/src/adapters/driving/http/auth.routes.ts`, `oauth-callback.use-case.ts`, `jwt-token.service.ts`, `packages/bff-service/src/app/create-app.ts` |
| RF04 | Recuperação de senha | Descontinuado (OAuth-only) | Fora de escopo do baseline vigente em 2026-04-08 |
| RF05 | Sessão com expiração configurável | Implementado | `packages/bff-service/src/app/config.ts` (`BFF_SESSION_MAX_AGE_SECONDS`), `cookie-session.service.ts` |
| RF07 | Logs de acesso (login/logout/tentativas inválidas) | Implementado (com fail-closed opcional) | `packages/identity-service/src/application/security-audit.ts`, `login.use-case.ts`, `logout.use-case.ts`, `login.use-case.spec.ts` |
| RF08 / RF09 | Registro e consulta de auditoria | Implementado | `packages/audit-service/src/adapters/driving/http/routes.ts`, `container.ts`, `openapi.ts` |
| RF10 | Versionamento de dados críticos | Parcial | Há versionamento/autorização de papéis em `identity`; não há engine completa de versionamento transversal |
| RF11 / RF12 / RF14 | Dashboard KPI + filtros + atualização | Implementado (baseline backend) | `packages/reporting-service/src/application/kpi-snapshots.service.ts`, `packages/reporting-service/src/adapters/driving/http/routes.ts` (`GET /reports/kpis`) e evidências em `docs/EvidenciasSprint4.md` |
| RF13 | Exportação PDF/CSV | Implementado | `packages/reporting-service/src/adapters/driving/http/routes.ts`, `export-jobs.service.ts`, `packages/bff-service/src/adapters/driving/http/auth.handlers.ts`, `packages/frontend/src/application/report-exports.service.js` |
| RF15 / RF16 | Compliance engine + violações | Implementado (nível atual) | `packages/compliance-service/src/container.ts`, `routes`, `use-cases` |
| RF17 | Pontuação de risco por evento/usuário/área | Implementado | `packages/risk-analysis-service/src/application/risk-score.service.ts`, `routes.ts`, consumo no BFF/frontend |
| RF18 | Integração bidirecional via API/Webhook | Parcial | `packages/integration-service/src/*` cobre ingestão/observabilidade; bidirecional completo depende de conectores externos |
| RF19 | Alertas automáticos e-mail/webhook | Implementado (núcleo) | `packages/notification-service/src/application/notification-dispatch.service.ts`, `routes.ts`, BFF/Frontend |
| RF20 | ML para detecção suspeita | Não implementado | Não há módulo/modelo ML no repositório |

---

## Regras de Negócio Críticas (`docs/RegrasDeNegocio.md`)

| ID | Regra | Status | Evidências no código |
|---|---|---|---|
| RN-001 / RN-002 | Acesso autenticado + JWT/OAuth2 | Implementado | middlewares de auth/permissão em `identity`, `audit`, `compliance` |
| RN-003 | Bloqueio após 5 tentativas inválidas | Implementado | `packages/identity-service/src/application/use-cases/login.use-case.ts`, `packages/identity-service/src/domain/entities/user.entity.ts`, `login.use-case.spec.ts` |
| RN-004 | Bloqueio gera auditoria/alerta | Implementado | `login.use-case.ts` (`ACCOUNT_LOCKED` + `notifyAdmin`), `login.use-case.spec.ts` |
| RN-008 | Login/logout/bloqueio auditados | Implementado | `login.use-case.ts`, `logout.use-case.ts`, `security-audit.ts`, testes de use-case |
| RN-005 | Expiração de sessão | Implementado | cookie do BFF com `maxAge` configurável |
| RN-006 | Sessão simultânea única por usuário | Implementado (OAuth-only) | rotação de `authzVersion` no login OAuth e logout + validação ativa em `identity-service` e `bff-service` |
| RN-094 | Desativação encerra sessões ativas | Implementado | `deactivate-user.use-case.ts` (incremento de `authzVersion`), `auth.middleware.ts` (rejeição por versão), `deactivate-user.use-case.spec.ts`, `auth.middleware.spec.ts` |
| RN-010..RN-014 | RBAC e restrição por papel | Implementado (núcleo) | `domain/types.ts`, `permissionsForRole`, middlewares de permissão |
| RN-020 / RN-021 | Registro de auditoria e imutabilidade | Implementado (nível aplicação + banco) | `audit-service` com `append-only` em banco (`prisma/migrations/20260521113000_enforce_audit_logs_append_only/migration.sql`), persistência por `create` sem mutação (`prisma-audit-log.repository.ts`) |
| RN-034..RN-037 | Aplicação de regras de compliance e ciclo da violação | Implementado (nível atual) | Fluxo de violação com regras de dispensa/justificativa e cobertura de integração no `compliance-service` (`items.integration.spec.ts`) |
| RN-040..RN-042 | Cálculo e recálculo de risco | Implementado (versão atual) | `RiskScoreService.ingest/list` |
| RN-050 / RN-052 / RN-054 | Notificações automáticas + canais + retentativa/dead-letter | Implementado (núcleo) | `NotificationDispatchService` com canais `email/webhook`, `maxRetries` e estado `dead_letter` |
| RN-051 / RN-053 / RN-055 / RN-056 | SLA crítico + roteamento por estrutura + log de entrega + preferências por usuário | Implementado | `packages/notification-service/src/application/notification-dispatch.service.ts`, `notification-preferences.service.ts`, `routes.ts`, migration Prisma de preferências, testes `notification-dispatch.service.spec.ts` e `notification-preferences.integration.spec.ts`, evidências em `docs/EvidenciasSprint3.md` |
| RN-060 / RN-063 | Dashboard por escopo/permissão + filtros | Parcial | filtros implementados no reporting (`/reports/kpis`); escopo organizacional completo ainda depende de enriquecimento de contexto por área/unidade no backend |
| RN-061 / RN-062 | Defasagem KPI <= 60s + fórmula de conformidade | Implementado (baseline atual) | `KpiSnapshotsService` calcula `(compliant/validated)*100` e expõe `sourceLagSeconds`; validações e evidência operacional em `docs/EvidenciasSprint4.md` |
| RN-064 / RN-065 | Exportação auditável com metadados | Implementado | `bff-service` publica `bff.reports.export.requested` com `requestedBy`, `requestedAtUTC`, `filters`, `format`, `scope` e `exportId`; download registra `bff.reports.export.downloaded`; cobertura em `auth.handlers.spec.ts` e evidência em `docs/EvidenciasSprint4.md` |
| RN-070..RN-074 | Integração autenticada/validada/registrada | Implementado (nível aplicação) | `integration-service` valida API key/envelope/idempotência + auditoria de entrada (`routes.ts`) e saída (`outbox-relay.adapter.ts`) com `responseStatus`/`responseTimeMs`; cobertura de testes em `routes.spec.ts` e `outbox-relay.adapter.spec.ts` |
| RN-102 | Sem audit service, suspender processamento | Parcial (controlado por configuração) | `AUDIT_FAIL_CLOSED=true` em publishers HTTP e RabbitMQ: `packages/shared/src/logger-audit.ts`, `bff/reporting/notification/risk-analysis/index.ts`, `identity/compliance/integration/container.ts` |
| RN-080..RN-084 | Retenção e anonimização com trilha | Implementado (monitor-only + anonimização identity) | identity: `anonymize-inactive-users.use-case.ts` (+ testes unitários); compliance: `run-retention-sweep.use-case.ts` + `compliance_retention_runs` + escopo configurável (`COMPLIANCE_RETENTION_SCOPE_STATUSES`); audit: `run-retention-sweep.use-case.ts` + `audit_retention_runs` + escopo configurável (`AUDIT_RETENTION_SCOPE_SOURCE_SERVICES`) |
| RN-103 | Timestamps em UTC | Implementado | serviços usam `new Date().toISOString()`; frontend converte para visualização |
| RN-105 | Erros técnicos não expostos ao usuário | Implementado (maior parte) | mapeadores e mensagens controladas em `shared`/handlers |

---

## Convergência Arquitetural (RequisitosCorp)

| Requisito corporativo | Status | Evidências |
|---|---|---|
| Microsserviços desacoplados por domínio | Implementado | pastas `packages/*-service` e gateway NGINX |
| APIs REST + JSON + versionamento | Implementado | rotas `/api/v1/*` e OpenAPI por serviço |
| Frontend desacoplado via BFF | Implementado | `packages/frontend` consumindo `/bff/*` |
| Health checks por serviço | Implementado | `GET /health` em serviços |
| Métricas por serviço para monitoramento | Implementado | `GET /metrics` em `identity`, `compliance`, `audit`, `bff`, `risk-analysis`, `reporting`, `notification`, e nativo no `integration` |
| Alertas ativos por SLO/SLA | Implementado (stack local) | `docker-compose.monitoring.yml`, `monitoring/prometheus.yml`, `monitoring/alerts.yml`, `monitoring/alertmanager.yml` |
| Backup automatizado (baseline local) | Implementado (scripts + retenção) | `scripts/backup-postgres.sh`, `scripts/restore-postgres.sh`, `Makefile` (`backup-db`, `restore-db`) |
| Documentação API unificada | Implementado | `packages/api-docs/src/app.ts` |
| Mensageria / async | Parcial | presente em partes de `identity`/`integration`; nem todos domínios usam fila real |
| Testes automatizados | Implementado (parcial por domínio) | suites em `identity`, `compliance`, `bff`, e novos testes unitários em `risk/reporting/notification` |

---

## Lacunas Prioritárias para Fechamento

1. Integrar alertas ativos (Prometheus/Alertmanager) para SLO/SLA documentados.

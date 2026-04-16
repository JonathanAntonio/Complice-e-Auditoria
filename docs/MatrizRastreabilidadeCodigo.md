# Matriz de Rastreabilidade de Requisitos x Código

Data de referência: 2026-04-08  
Escopo: microservices atuais (`identity`, `compliance`, `audit`, `integration`, `bff`, `risk-analysis`, `reporting`, `notification`, `api-docs`).

## Resumo Executivo

| Categoria | Status |
|---|---|
| Requisitos centrais de autenticação OAuth/JWT, RBAC, compliance, auditoria e integração REST | Implementado |
| Requisitos novos de risco, exportação e notificação | Implementado (com cobertura de testes unitários) |
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
| RF07 | Logs de acesso (login/logout/tentativas inválidas) | Parcial | `packages/identity-service/src/application/security-audit.ts`, `oauth-callback.use-case.ts`, `logout.use-case.ts` |
| RF08 / RF09 | Registro e consulta de auditoria | Implementado | `packages/audit-service/src/adapters/driving/http/routes.ts`, `container.ts`, `openapi.ts` |
| RF10 | Versionamento de dados críticos | Parcial | Há versionamento/autorização de papéis em `identity`; não há engine completa de versionamento transversal |
| RF11 / RF12 / RF14 | Dashboard KPI + filtros + atualização | Parcial | `packages/frontend/src/App.jsx` com filtros e atualização; não há SLA técnico explícito de 60s em backend |
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
| RN-003 | Bloqueio após 5 tentativas inválidas | Parcial | Entidade e persistência suportam `failedLoginAttempts/blockedUntil`, mas o fluxo completo de incremento por tentativa não está visível em todos os caminhos |
| RN-005 | Expiração de sessão | Implementado | cookie do BFF com `maxAge` configurável |
| RN-006 | Sessão simultânea única por usuário | Implementado (OAuth-only) | rotação de `authzVersion` no login OAuth e logout + validação ativa em `identity-service` e `bff-service` |
| RN-010..RN-014 | RBAC e restrição por papel | Implementado (núcleo) | `domain/types.ts`, `permissionsForRole`, middlewares de permissão |
| RN-020 / RN-021 | Registro de auditoria e imutabilidade | Parcial | Audit service com leitura e trilha; política de imutabilidade forte/infra não totalmente verificável apenas pelo código app |
| RN-034..RN-037 | Aplicação de regras de compliance e ciclo da violação | Parcial | Fluxos de violação implementados; ciclo completo de aprovação dupla/dispensa avançada não evidenciado |
| RN-040..RN-042 | Cálculo e recálculo de risco | Implementado (versão atual) | `RiskScoreService.ingest/list` |
| RN-050 / RN-052 / RN-054 | Notificações automáticas + canais + retentativa/dead-letter | Implementado (núcleo) | `NotificationDispatchService` com canais `email/webhook`, `maxRetries` e estado `dead_letter` |
| RN-060 / RN-063 | Dashboard por escopo/permissão + filtros | Parcial | frontend usa permissões e filtros; escopo organizacional completo depende de dados de domínio adicionais |
| RN-064 / RN-065 | Exportação auditável com metadados | Implementado (via integração auditável) | `bff-service` publica eventos de exportação/notificação no `integration-service` |
| RN-070..RN-074 | Integração autenticada/validada/registrada | Parcial | integração possui validação e estrutura de observabilidade; cobertura completa de idempotência e trilha de todas chamadas depende de cenário externo |
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
| Documentação API unificada | Implementado | `packages/api-docs/src/app.ts` |
| Mensageria / async | Parcial | presente em partes de `identity`/`integration`; nem todos domínios usam fila real |
| Testes automatizados | Implementado (parcial por domínio) | suites em `identity`, `compliance`, `bff`, e novos testes unitários em `risk/reporting/notification` |

---

## Lacunas Prioritárias para Fechamento

1. Integrar alertas ativos (Prometheus/Alertmanager) para SLO/SLA documentados.

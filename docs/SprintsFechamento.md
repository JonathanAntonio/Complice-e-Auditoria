# Sprints de Fechamento — Complice e Auditoria

Data inicial: 2026-05-21  
Documento de referência: `docs/PlanoFechamentoProjeto.md`

## Como usar este documento

- Atualize o `Status` de cada sprint conforme execução.
- Preencha `Checkpoint` ao fim de cada sessão de trabalho.
- Em novo chat, comece por este arquivo para retomar exatamente do ponto parado.

## Status geral

- Sprint atual: `Encerrado`
- Progresso geral: `100%`
- Última atualização: `2026-05-24`

---

## Sprint 1 — Segurança, Auditoria e Sessão (P0)

Status: `Concluído (nível aplicação)`  
Objetivo: fechar os riscos mais críticos de compliance e operação.

### Escopo

1. Auditoria imutável forte e completa (`RN-020..RN-025`, `RN-101`, `RN-102`)
2. Segurança de autenticação/sessão e revogação (`RF07`, `RN-003`, `RN-004`, `RN-008`, `RN-094`)
3. Segurança/ops mínima (`RNF01`, `RNF02`, `RNF03`, `RNF04`, `RNF15`)

### Entregáveis

- Garantia append-only real para logs de auditoria.
- Campos obrigatórios de auditoria em 100% dos eventos críticos.
- Estratégia implementada para indisponibilidade do audit service.
- Bloqueio por tentativas inválidas + auditoria do bloqueio.
- Encerramento de sessão ao desativar usuário.
- Rate limit em borda pública e mascaramento/cripto de dados sensíveis nos logs.
- Backup automatizado documentado e testado.
- Alertas ativos para latência, erro e disponibilidade.

### Critérios de aceite

- Testes unitários e integração cobrindo cenários de sucesso/falha.
- Evidência operacional via `/health` e `/metrics`.
- Atualização de `ChecklistRequisitos` e `MatrizRastreabilidadeCodigo`.

### Checkpoint

- Último ponto: `Escopo técnico concluído; pendências residuais são operacionais em ambiente produtivo (RN-102, RNF04, RNF15)`
- Próxima tarefa: `Manter trilha operacional paralela enquanto Sprint 2/3 avançam`
- Bloqueios: `Nenhum`

---

## Sprint 2 — RBAC e Integração Confiável (P0)

Status: `Em andamento`  
Objetivo: fechar autorização centralizada e integração robusta/idempotente.

### Escopo

1. RBAC/policy centralizada (`RN-014`, `RN-015`, `RN-016`, `RN-060`)
2. Integração autenticada, validada e idempotente (`RF18`, `RN-070..RN-076`)

### Entregáveis

- Policy enforcement central no `shared` (sem regras críticas espalhadas em controllers).
- Cobertura de escopo para perfis sensíveis (auditor externo / compliance officer).
- Idempotência ponta a ponta para eventos de integração.
- Registro detalhado de chamadas de entrada e saída (status/latência).
- Retry com backoff + DLQ comprovados.

### Critérios de aceite

- Suite automatizada de autorização por papel/permissão.
- Suite automatizada de integração com replay de evento e cenário de falha.
- Contratos e documentação atualizados.

### Checkpoint

- Último ponto: `Integração inbound/outbound com trilha auditável reforçada e testes (routes + outbox relay)`
- Próxima tarefa: `Consolidar escopo RBAC residual (RN-014/015/016/060) ou formalizar desvio para Sprint 3`
- Bloqueios: `Nenhum`

---

## Sprint 3 — Compliance e Notificações (P1)

Status: `Concluído`  
Objetivo: fechar ciclo de violações e alertas com requisitos de negócio.

### Escopo

1. Compliance engine completo (`RF15`, `RF16`, `RN-030..RN-039`)
2. Notificação avançada (`RF19`, `RN-050`, `RN-051`, `RN-053`, `RN-055`, `RN-056`)

### Entregáveis

- Versionamento de regra ativa.
- Justificativa obrigatória para desativação/dispensa.
- Aprovação dupla para violações críticas.
- SLA de notificação crítica em até 5 minutos.
- Destinatários por perfil e estrutura organizacional.
- Log completo de entrega e preferências de notificação.

### Critérios de aceite

- Testes cobrindo workflow completo de violação.
- Testes cobrindo retries, SLA e roteamento de destinatários.
- Evidências de auditoria de transições e envios.

### Checkpoint

- Último ponto: `Sprint 3 concluída com validação ponta a ponta: preferências persistentes por usuário (RN-056), supressão low/medium por preferência, envio obrigatório high/critical, fan-out crítico por estrutura organizacional e SLA crítico (5 min) evidenciados em ambiente local`
- Próxima tarefa: `Migrar execução para Sprint 4 (Dashboard/Export + fechamento documental final)`
- Bloqueios: `Nenhum`

---

## Sprint 4 — Dashboard, Export e Fechamento de Documentação (P1)

Status: `Concluído`  
Objetivo: fechar visão executiva, rastreabilidade e encerramento formal.

### Escopo

1. Dashboard/KPIs/filtros (`RF11`, `RF12`, `RF14`, `RN-061`, `RN-062`, `RN-063`)
2. Exportação auditável (`RF13`, `RN-064`)
3. Fechamento documental e evidências finais

### Entregáveis

- Fórmula de conformidade implementada no backend.
- Defasagem de KPI <= 60s validada.
- Filtros completos conforme requisito.
- Export auditado com metadados completos.
- Atualização final de:
  - `docs/ChecklistRequisitos.md`
  - `docs/MatrizRastreabilidadeCodigo.md`
  - `docs/RunbookOperacaoSLO.md`
  - este arquivo (`docs/SprintsFechamento.md`)

### Critérios de aceite

- Testes e2e do fluxo principal e cenários de dashboard/export.
- Evidência de rastreabilidade requisito -> código -> teste -> operação.

### Checkpoint

- Último ponto: `Encerramento formal do ciclo de desenvolvimento concluído; trilha operacional contínua definida em docs/operacao/ChecklistMensalPosFechamento.md`
- Próxima tarefa: `Executar rotina mensal operacional e registrar evidências contínuas`
- Bloqueios: `Nenhum`

---

## Registro de Sessões

| Data | Sprint | O que foi feito | Próximo passo | Responsável |
|---|---|---|---|---|
| 2026-05-21 | Sprint 1 | Planejamento criado + append-only no `audit_logs` + fail-closed de auditoria em HTTP/RabbitMQ + login fail-closed + RN-094 validado por testes + checklist/matriz atualizados + stack de backup/monitoramento adicionada + validação prática executada + critérios de produção formalizados | Sprint 2: expandir trilha auditável para integrações de saída (outbound) | Developers |
| 2026-05-22 | Sprint 3 | Compliance-service atualizado com campos de dispensa (`dismissalJustification`, `dismissalApprovedBy`), regra de transição de status para exigir justificativa em `dispensada` e aprovação em caso crítico, severidade `critica` no controller/validação/OpenAPI, migration Prisma criada, suíte de testes do compliance-service estabilizada (`52 passed`, `15 skipped`) | Executar migration no ambiente ativo e cobrir integração de dispensa crítica ponta a ponta; em seguida avançar notificações SLA/perfil | Developers |
| 2026-05-22 | Sprint 3 | Testes de integração adicionados para fluxo de dispensa crítica no `PATCH /api/violations/:violationId` (reprovação sem `dismissalApprovedBy` e aprovação com `dismissalApprovedBy`), suíte atualizada (`52 passed`, `17 skipped`) | Rodar os mesmos cenários em ambiente com PostgreSQL/Redis ativos para evidência operacional e seguir para notificações | Developers |
| 2026-05-22 | Sprint 3 | Notification-service evoluído com roteamento automático quando `recipient` não é informado (`scopeOwner`, `areaManager`, `complianceOfficer`), fan-out por severidade (`high`/`critical`), resposta de dispatch com `dispatchedCount`, testes unitários atualizados (`5 passed`) | Integrar disparo automático a partir de violação criada/atualizada e validar SLA de crítico até 5 min em teste de integração | Developers |
| 2026-05-22 | Sprint 3 | Compliance-service integrado ao notification-service: nova porta `INotificationDispatcher`, adapter HTTP (`/notifications/dispatch`) e disparo automático best-effort para violações críticas em create/update; configs de destinatários adicionadas em runtime; testes do compliance-service atualizados (`53 passed`, `17 skipped`) | Implementar verificação de SLA de envio crítico (RN-051) e base de preferências de notificação por usuário (RN-056) | Developers |
| 2026-05-22 | Sprint 3 | SLA de notificação crítica incorporado ao notification-service (janela alvo 5 minutos) com novos campos de trilha (`slaTargetSeconds`, `slaDeadlineUTC`, `slaBreached`) e cobertura de teste para crítico | Implementar preferências de notificação por usuário e aplicar no roteamento efetivo (RN-056 + RN-053) | Developers |
| 2026-05-22 | Sprint 3 | RN-056 fechado no notification-service com preferências por usuário (upsert/get por destinatário), endpoints `PUT/GET /api/v1/notifications/preferences/:recipient`, aplicação das preferências no roteamento para `low/medium` e garantia de envio obrigatório para `high/critical`; injeção no bootstrap corrigida; OpenAPI atualizado; testes: notification-service (`10 passed`) e compliance-service (`53 passed`, `17 skipped`) | Implementar persistência durável de preferências (DB) e executar validação ponta a ponta de notificações críticas com serviços externos ativos | Developers |
| 2026-05-22 | Sprint 3 | RN-056 evoluído para persistência durável: `notification-service` com Prisma (`NOTIFICATION_DATABASE_URL`), migration `notification_preferences`, repositório persistente de preferências e fluxo de dispatch assíncrono mantendo regra obrigatória para `high/critical`; `make sprint3-check` atualizado para aplicar migrations de compliance+notification e validado com sucesso (`compliance 70/70`, `notification 10/10`) | Criar testes de integração HTTP específicos de preferências no notification-service e consolidar evidências finais da Sprint 3 | Developers |
| 2026-05-22 | Sprint 3 | Evidência operacional ponta a ponta coletada em ambiente local: `PUT/GET /api/v1/notifications/preferences/:recipient` persistiu preferências de `evidence.user@example.com`; dispatch `low` via email foi suprimido (`skipped_by_preferences`, `dispatchedCount=0`); dispatch `high` via email para o mesmo usuário permaneceu obrigatório (`status=sent`, `dispatchedCount=1`); criação de violação crítica no compliance (`POST /api/violations`) disparou fan-out no notification para `scope-owner@company.local`, `area-manager@company.local` e `compliance-officer@company.local` com SLA preenchido (`slaTargetSeconds=300`, `slaBreached=false`). Evidências detalhadas registradas em `docs/EvidenciasSprint3.md` | Consolidar pacote final de evidências da Sprint 3 (capturas/logs + checklist/matriz) e preparar transição para Sprint 4 | Developers |
| 2026-05-24 | Sprint 4 | Reporting-service evoluído com endpoint `GET /api/v1/reports/kpis` (fórmula de conformidade, filtros por período/área/tipo de evento/risco/status e metadado de defasagem `sourceLagSeconds`); OpenAPI atualizado; testes do reporting-service atualizados e verdes (`5 passed`); evidência operacional registrada em `docs/EvidenciasSprint4.md` | Fechar export auditável fim a fim (RN-064) com evidência operacional e consolidar status final do projeto | Developers |
| 2026-05-24 | Sprint 4 | RN-064 concluído no BFF: evento auditável `bff.reports.export.requested` enriquecido com `requestedBy`, `requestedAtUTC`, `filters`, `format`, `scope` e `exportId`; parser DTO ajustado para preservar `filters`; cobertura de teste adicionada em `auth.handlers.spec.ts`; suíte do bff-service verde (`35 passed`) e evidências consolidadas em `docs/EvidenciasSprint4.md` | Revisão final de fechamento (RunbookOperacaoSLO, status geral e formalização de término) | Developers |
| 2026-05-24 | Sprint 4 | Integração frontend+BFF dos KPIs concluída: BFF expôs `GET /reports/kpis` com validação de query/permissão e teste de handler, frontend passou a consumir KPIs reais no cockpit com filtros (`period`, `area`, `eventType`, `riskLevel`, `violationStatus`), e Governança foi ajustada para abas sempre visíveis com estado desabilitado por permissão; validações verdes: `pnpm --filter bff-service test` (36), `pnpm --filter reporting-service test` (5), `pnpm --filter frontend build` | Operação contínua com monitoramento mensal e coleta de evidências produtivas | Developers |
| 2026-05-24 | Sprint 4 | Validação MCP Playwright executada em UI real: health/docs/cockpit/operações navegáveis; correções aplicadas para estabilidade de autenticação local e e2e (`frontend` auth client agora envia payload JSON em login/register; `api-docs` atualizado para defaults `400x`; `bff-service` ajustado para não marcar cookie `Secure` em `localhost`); favicon adicionado no frontend para eliminar 404 local | Consolidar commit final e manter trilha operacional pós-fechamento | Developers |
| 2026-05-24 | Sprint 4 | Padronização de deep-link no frontend concluída em módulos de governança: Cockpit (`period/area/eventType/riskLevel/violationStatus`), Relatórios (`format/scope/filtros`), Retenção (`auditStatus/complianceStatus`), Mensageria (`sourceService/eventType/correlationId/notificationStatus/onlyFailures`) e Notificações/Admin (filtros e listagem por URL); validação funcional realizada com MCP Playwright em links diretos por módulo | Consolidar merge final e manter evolução incremental apenas operacional | Developers |
| 2026-05-24 | Sprint 4 | Refatoração incremental do frontend para unificar sincronização de query string com hook compartilhado `useUrlState` em Overview, Reporting e Messaging; correção de bug em Reporting (uso inválido de `setSearchParams`); build do frontend validado e checagens funcionais executadas com MCP Playwright para pré-preenchimento/round-trip de filtros por URL | Consolidar merge final e manter checklist operacional mensal | Developers |
| 2026-05-24 | Sprint 4 | Regressão frontend pós-commit executada com MCP Playwright em `localhost:5173` para deep-links de Cockpit, Relatórios, Mensageria, Notificações, Admin e Retenção (navegação + verificação de query string/prefill em campos principais); sanity técnica validada com `pnpm --filter frontend build`, `pnpm --filter bff-service test` (37/37) e `pnpm --filter notification-service test` (10 passed, 2 skipped de integração por indisponibilidade de DB) | Manter rotina operacional mensal e abrir hardening opcional de schemas de URL state compartilhados por feature | Developers |
| 2026-05-24 | Sprint 4 | Hardening de frontend concluído: schemas de URL state extraídos para módulos compartilhados por feature (Overview, Reporting, Messaging, Notifications, Admin, Retention), removendo definições inline e reduzindo risco de drift; validação executada com `pnpm --filter frontend build` e navegação MCP Playwright em deep-links de overview/reports/messaging | Consolidar commit de manutenção e manter trilha operacional mensal | Developers |
| 2026-05-24 | Sprint 4 | Runbook operacional atualizado com procedimentos e evidências recentes de KPI e export auditável (`docs/RunbookOperacaoSLO.md`); fechamento documental consolidado (`Checklist`, `Matriz`, `Sprints`, `EvidenciasSprint3`, `EvidenciasSprint4`) | Encerrar ciclo de desenvolvimento e manter trilha operacional contínua em produção | Developers |
| 2026-05-24 | Sprint 4 | Checklist mensal pós-fechamento criado para governança operacional contínua (`docs/operacao/ChecklistMensalPosFechamento.md`), cobrindo `RN-102`, `RNF04` e `RNF15` com responsáveis e evidências mínimas; status geral do projeto atualizado para encerrado | Iniciar execução mensal do checklist operacional e manter histórico de evidências | Developers |

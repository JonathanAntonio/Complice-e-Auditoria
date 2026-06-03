# Execução — Requisitos Parciais

Data de início: 2026-05-26
Referência: `docs/PlanoResolucaoRequisitosParciais.md`

## Onda 1 (P0) — Em andamento

## 1) RN-102 — Fail-closed operacional

Status: `Em andamento`

- [x] Levantar todos os serviços que publicam auditoria (HTTP/RabbitMQ).
- [x] Aplicar fail-closed explícito nos serviços que estavam sem configuração direta (`reporting`, `notification`, `compliance`, `audit`).
- [ ] Validar configuração efetiva `AUDIT_FAIL_CLOSED=true` em cada ambiente alvo.
- [ ] Coletar evidência por serviço (config ativa + teste de comportamento quando audit indisponível).
- [ ] Consolidar evidências no runbook/checklist operacional.

Critério de conclusão:
- `AUDIT_FAIL_CLOSED=true` comprovado e monitorado continuamente em todos os serviços alvo.

Serviços-alvo identificados (código):
1. `bff-service` (`packages/bff-service/src/index.ts`)
2. `risk-analysis-service` (`packages/risk-analysis-service/src/index.ts`)
3. `reporting-service` (`packages/reporting-service/src/index.ts`)
4. `notification-service` (`packages/notification-service/src/index.ts`)
5. `identity-service` (`packages/identity-service/src/container.ts`)
6. `compliance-service` (`packages/compliance-service/src/container.ts`)
7. `integration-service` (`packages/integration-service/src/container.ts`)
8. `audit-service` (`packages/audit-service/src/container.ts`)

Progresso técnico RN-102 (baseline de código):
1. `bff-service`, `risk-analysis-service`, `identity-service` e `integration-service` já estavam com fail-closed explícito.
2. `reporting-service` e `notification-service` foram ajustados para:
   - passar `failClosed: auditFailClosed` no `HttpAuditPublisher`;
   - definir `onUnavailable` com `fatal` + `process.exit(1)`;
   - executar `publisher.assertAvailable()` no bootstrap quando `AUDIT_FAIL_CLOSED=true`.
3. `compliance-service` e `audit-service` foram ajustados para:
   - passar `failClosed: auditFailClosed` no `wrapWithAudit`;
   - definir `onUnavailable` com `fatal` + `process.exit(1)`.
4. Confirmação técnica em `packages/shared/src/logger-audit.ts`: padrão de `failClosed` é `false`, portanto a configuração explícita era necessária.

## 2) RNF04 — Backup automatizado em produção

Status: `Em andamento`

- [x] Inventariar mecanismo de agendamento por ambiente (cron/systemd/orquestrador).
- [ ] Publicar rotina oficial de backup diário + retenção.
- [ ] Executar teste de restore em ambiente controlado com evidência de sucesso.
- [ ] Definir verificação periódica e responsável operacional.

Critério de conclusão:
- Backup/restore com evidência recorrente em produção e retenção validada.

Inventário técnico encontrado:
1. Scripts prontos:
   - `scripts/backup-postgres.sh`
   - `scripts/restore-postgres.sh`
2. Templates de agendamento:
   - `deploy/cron.backup-postgres.example`
   - `deploy/systemd/ca-postgres-backup.service`
   - `deploy/systemd/ca-postgres-backup.timer`
3. Procedimento consolidado:
   - `docs/RunbookOperacaoSLO.md` (seção RNF04)
   - `docs/operacao/ChecklistProducaoSprint1.md`
   - `docs/operacao/ChecklistMensalPosFechamento.md`

## 3) RNF15 — Alertas ativos em produção

Status: `Em andamento`

- [x] Confirmar regras ativas no Prometheus e roteamento no Alertmanager.
- [ ] Validar alerta de indisponibilidade e fluxo de notificação ponta a ponta.
- [ ] Registrar evidências periódicas de alertas, ack e resposta.
- [ ] Vincular runbook de resposta a incidentes.

Critério de conclusão:
- Alertas críticos operando continuamente com evidência de notificação e resposta.

Inventário técnico encontrado:
1. Regras de alerta configuradas em `monitoring/alerts.yml`:
   - `ServiceDown`
   - `Api5xxRatioHigh`
   - `ApiLatencyP95High`
2. Roteamento Alertmanager em `monitoring/alertmanager.yml` com receiver `default` e webhook configurado.
3. Procedimento consolidado:
   - `docs/RunbookOperacaoSLO.md` (seção RNF15)
   - `docs/operacao/ChecklistProducaoSprint1.md`
   - `docs/operacao/ChecklistMensalPosFechamento.md`

## 4) Alinhamento de baseline e status

Status: `Em andamento`

- [x] Resolver divergências entre `ChecklistRequisitos.md` e `MatrizRastreabilidadeCodigo.md`.
- [x] Marcar oficialmente requisitos `Descontinuado` (quando aplicável, ex.: OAuth-only).
- [x] Publicar critério único para status (`Completo`, `Parcial`, `Descontinuado`).

Critério de conclusão:
- Checklist e matriz sincronizados, sem conflito de classificação.

Progresso:
1. `docs/ChecklistRequisitos.md` harmonizado em `2026-05-26` usando a matriz como referência mais recente.
2. `RF04` marcado como `Descontinuado` (baseline OAuth-only).
3. Divergências de status principais foram reconciliadas no checklist (`RF13`, `RF15`, `RF16`, `RN-070..RN-074`, `RN-084`, entre outras).
4. `docs/MatrizRastreabilidadeCodigo.md` atualizado para refletir baseline de código atual do `RN-102` (fail-closed explícito nos 8 serviços) e manter pendência apenas operacional.

## Próximo checkpoint

Quando os itens acima forem fechados, avançar para Onda 2 (Auditoria + Identidade).

## Atualizações recentes (2026-05-26)

1. Guia de coleta operacional criado: `docs/operacao/ColetaEvidenciasComandos.md`.
2. Relatório do ciclo `2026-06` atualizado com pré-evidências de configuração e agendamento:
   - `docs/operacao/EvidenciasOperacionais-2026-06.md`.
3. Checklist formal de fechamento mensal criado:
   - `docs/operacao/FechamentoMensalOperacional.md`.
4. Lote 1 (código) iniciado com reforços transversais de auditoria:
   - normalização de payload obrigatório em `packages/shared/src/logger-audit.ts` (`action`, `entity`, `ipAddress`, `sourceSystem`, `previousValue`, `newValue`);
   - fallback de ator de sistema no `audit-service` (`system:<producer>`) para evitar gravação sem identificador de ator;
   - testes atualizados e passando em `@lframework/shared` e `audit-service`.
5. `identity-service` reforçado para `RN-101` no fluxo de criação:
   - `create-user` agora grava evento de domínio (`user.created`) + evento explícito de auditoria (`identity.auth.user_created`) no mesmo fluxo de persistência;
   - nova capacidade de persistência em lote no repositório (`saveUserAndOutboxBatch`) implementada em `prisma-user.repository.ts`;
   - suíte de testes do `identity-service` executada com sucesso.
6. Refatoração aplicada para remover retrabalho e risco de inconsistência:
   - removido fallback não atômico no `create-user` (que poderia gravar em duas transações separadas);
   - `prisma-user.repository.ts` consolidado em caminho único `persistUserWithOutboxEvents` para eliminar duplicação de SQL/transação;
   - fluxo de persistência de usuário + eventos ficou único, transacional e mais simples de manter.

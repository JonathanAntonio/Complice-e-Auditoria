# Evidências Operacionais Mensais

Mês de referência: `2026-06`  
Ambiente: `produção/homologação`  
Responsável: `A definir`

## 1) RN-102 — Fail-closed de auditoria

Status: `Parcial (baseline de código concluído; evidência de ambiente pendente)`

## 1.1 Baseline de código (concluído)

- [x] `AUDIT_FAIL_CLOSED` com fail-closed explícito nos serviços-alvo.
- [x] `reporting-service` e `notification-service` com `assertAvailable()` no bootstrap quando fail-closed ativo.

Referências:
- `packages/bff-service/src/index.ts`
- `packages/risk-analysis-service/src/index.ts`
- `packages/reporting-service/src/index.ts`
- `packages/notification-service/src/index.ts`
- `packages/identity-service/src/container.ts`
- `packages/compliance-service/src/container.ts`
- `packages/integration-service/src/container.ts`
- `packages/audit-service/src/container.ts`

## 1.2 Evidência de ambiente (pendente)

- [ ] Confirmar `AUDIT_FAIL_CLOSED=true` em produção para todos os serviços-alvo.
- [ ] Executar simulação controlada de indisponibilidade de auditoria em homologação.

Pré-evidência de configuração:
- `.env.production.example` define `AUDIT_FAIL_CLOSED=true`.

## 2) RNF04 — Backup e restore

Status: `Parcial (procedimento pronto; evidência contínua de produção pendente)`

## 2.1 Baseline técnico (concluído)

- [x] Script de backup disponível (`scripts/backup-postgres.sh`).
- [x] Script de restore disponível (`scripts/restore-postgres.sh`).
- [x] Templates de agendamento disponíveis (`deploy/cron.backup-postgres.example`, `deploy/systemd/*`).

Detalhes do agendamento padrão definido:
- Cron example: execução diária às `02:00 UTC`.
- Systemd timer: `OnCalendar=*-*-* 02:00:00`.

## 2.2 Evidência local prévia (concluída)

- [x] Backup validado localmente em `2026-05-21`.
- [x] Artefato: `./backups/postgres/postgres_20260521T145029Z.sql.gz`.

Fonte:
- `docs/RunbookOperacaoSLO.md`

## 2.3 Evidência de produção (pendente)

- [ ] Agendamento diário ativo no ambiente-alvo.
- [ ] Evidência mensal de artefatos `postgres_*.sql.gz`.
- [ ] Teste de restore mensal em ambiente controlado.

## 3) RNF15 — Monitoramento e alertas

Status: `Parcial (stack e regras prontas; evidência contínua de produção pendente)`

## 3.1 Baseline técnico (concluído)

- [x] Regras configuradas: `ServiceDown`, `Api5xxRatioHigh`, `ApiLatencyP95High`.
- [x] Alertmanager configurado com receiver default e webhook.

Detalhe de roteamento:
- `monitoring/alertmanager.yml`: receiver `default` com `webhook_configs` para `http://host.docker.internal:9999/alerts`.

Arquivos:
- `monitoring/alerts.yml`
- `monitoring/alertmanager.yml`

## 3.2 Evidência local prévia (concluída)

- [x] Alerta `ServiceDown` validado localmente em `2026-05-21` (`firing`).

Fonte:
- `docs/RunbookOperacaoSLO.md`

## 3.3 Evidência de produção (pendente)

- [ ] Targets críticos `UP` em produção.
- [ ] Teste controlado de disparo com ack/resolução registrada.
- [ ] Evidência mensal de operação contínua.

## 4) Aprovação mensal

- [ ] Todos os itens obrigatórios preenchidos.
- [ ] Desvios registrados com plano de ação e prazo.

Aprovador técnico: `A definir`  
Data: `YYYY-MM-DD`

## Referência de coleta

- `docs/operacao/ColetaEvidenciasComandos.md`

Bundle local gerado em `2026-05-26`:
- `out/evidencias-operacionais/20260526T175344Z/summary.txt`
- `out/evidencias-operacionais/20260526T175344Z/rn102_fail_closed.txt`
- `out/evidencias-operacionais/20260526T175344Z/rnf04_backup.txt`
- `out/evidencias-operacionais/20260526T175344Z/rnf15_alerting.txt`

Bundle local gerado via `make evidencias-operacionais` em `2026-05-26`:
- `out/evidencias-operacionais/20260526T175645Z/summary.txt`
- `out/evidencias-operacionais/20260526T175645Z/rn102_fail_closed.txt`
- `out/evidencias-operacionais/20260526T175645Z/rnf04_backup.txt`
- `out/evidencias-operacionais/20260526T175645Z/rnf15_alerting.txt`

# Checklist de Produção — Fechamento Sprint 1

Data: 2026-05-21

## Objetivo

Garantir que os itens críticos de segurança operacional do Sprint 1 estejam ativos em ambiente produtivo.

## 1) Auditoria fail-closed

- [ ] `AUDIT_FAIL_CLOSED=true` configurado em todos os serviços.
- [ ] Política de restart do orquestrador habilitada.
- [ ] Alertas para reinício/falha por `Audit unavailable` ativos.

Referências:
- `docs/RunbookOperacaoSLO.md`
- `.env.production.example`

## 2) Backup diário PostgreSQL (RNF04)

- [ ] Rotina agendada com `cron` ou `systemd timer`.
- [ ] Retenção mínima de 30 dias configurada.
- [ ] Execução de restore testada em ambiente de validação.
- [ ] Logs de execução do backup disponíveis para auditoria técnica.

Referências:
- `scripts/backup-postgres.sh`
- `scripts/restore-postgres.sh`
- `deploy/cron.backup-postgres.example`
- `deploy/systemd/ca-postgres-backup.service`
- `deploy/systemd/ca-postgres-backup.timer`

## 3) Monitoramento e alertas (RNF15)

- [ ] Prometheus e Alertmanager em execução contínua.
- [ ] Regras `ServiceDown`, `Api5xxRatioHigh`, `ApiLatencyP95High` carregadas.
- [ ] Destino real de webhook de alertas configurado.
- [ ] Evidência de pelo menos 1 teste de disparo de alerta em produção controlada.

Referências:
- `docker-compose.monitoring.yml`
- `monitoring/prometheus.yml`
- `monitoring/alerts.yml`
- `monitoring/alertmanager.yml`

## 4) Evidências mínimas para auditoria interna

- [ ] Captura de execução de backup (timestamp + arquivo gerado).
- [ ] Captura de execução de restore em ambiente de validação.
- [ ] Captura de alerta `firing` com timestamp.
- [ ] Registro de rollback/recovery após teste.

## Status atual (local/dev)

- [x] Backup executado com arquivo gerado em `2026-05-21`.
- [x] Alerta `ServiceDown` validado em `firing` em `2026-05-21`.
- [ ] Evidências de operação contínua em produção.

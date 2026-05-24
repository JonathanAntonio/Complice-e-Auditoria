# Runbook de Operação e SLO

Data de atualização: 2026-05-24

## Endpoints de Saúde e Métricas

Serviços com `GET /health` e `GET /metrics`:

- `identity-service`
- `compliance-service`
- `audit-service`
- `integration-service`
- `bff-service`
- `risk-analysis-service`
- `reporting-service`
- `notification-service`

Formato de métricas: Prometheus text exposition.

## SLO/SLA Operacional (baseline)

- Disponibilidade alvo (SLA): `99,5%` para `audit-service` e `compliance-service`.
- Latência alvo (SLO): `P95 < 500ms` para rotas síncronas críticas.
- Erro alvo (SLO): manter taxa de respostas `5xx` abaixo de `1%` por janela de 5 minutos.

## Indicadores Prometheus Relevantes

- `http_requests_total{service,method,route,status_class}`
- `http_request_duration_seconds_bucket{service,method,route,status_code,le}`
- `http_request_duration_seconds_sum{service,method,route,status_code}`
- `http_request_duration_seconds_count{service,method,route,status_code}`
- `process_uptime_seconds{service}`
- `process_resident_memory_bytes{service}`

## Retenção e Anonimização (sem sistema de senha)

No baseline OAuth-only, o requisito de retenção/anonimização é atendido no `identity-service` por job automático:

- Job: anonimização de usuários inativos com `deactivated_at` >= 2 anos.
- Execução inicial no bootstrap + execução periódica por `RETENTION_SWEEP_INTERVAL_MS`.
- Política mínima: `INACTIVE_USER_ANONYMIZATION_AFTER_DAYS` nunca abaixo de `730`.
- Trilha auditável: para cada anonimização, evento `identity.data.user_anonymized` é escrito no outbox.

Variáveis:

- `RETENTION_SWEEP_INTERVAL_MS` (default: `3600000`)
- `INACTIVE_USER_ANONYMIZATION_AFTER_DAYS` (default/mínimo: `730`)
- `INACTIVE_USER_ANONYMIZATION_BATCH_SIZE` (default: `100`)

Para retenção legal de histórico:

- `compliance-service`: sweep periódico monitor-only para violações `resolvida/dispensada`, grava em `compliance_retention_runs`.
- `audit-service`: sweep periódico monitor-only para logs elegíveis por janela, grava em `audit_retention_runs`.

Variáveis adicionais:

- `COMPLIANCE_RETENTION_SWEEP_INTERVAL_MS` (default: `3600000`)
- `COMPLIANCE_RETENTION_MIN_DAYS` (default/mínimo: `1825`)
- `COMPLIANCE_RETENTION_BATCH_SIZE` (default: `200`)
- `COMPLIANCE_RETENTION_SCOPE_STATUSES` (default: `resolvida,dispensada`)
- `AUDIT_RETENTION_SWEEP_INTERVAL_MS` (default: `3600000`)
- `AUDIT_RETENTION_MIN_DAYS` (default/mínimo: `1825`)
- `AUDIT_RETENTION_BATCH_SIZE` (default: `1000`)
- `AUDIT_RETENTION_SCOPE_SOURCE_SERVICES` (default: vazio = todos os serviços origem)

## Validação Rápida

1. Suba os serviços e consulte `GET /health`.
2. Gere tráfego na API.
3. Consulte `GET /metrics` e valide presença de:
   - `http_requests_total`
   - `http_request_duration_seconds_*`
4. Para retenção, inative usuário com `deactivated_at` antigo e confirme evento no outbox de identity.

## Modo Fail-Closed de Auditoria (RN-102)

Para impedir operação sem garantia de auditoria, os serviços suportam:

- `AUDIT_FAIL_CLOSED=true`

Comportamento quando ativo:

- Serviços com publisher HTTP (`bff`, `reporting`, `notification`, `risk-analysis`):
  - validam `GET /health` do `audit-service` no bootstrap;
  - se auditoria ficar indisponível durante publicação, encerram o processo.
- Serviços com publisher RabbitMQ (`identity`, `compliance`, `integration`):
  - se o publish de auditoria falhar/rejeitar, encerram o processo.

Recomendação operacional:

1. Ativar `AUDIT_FAIL_CLOSED=true` em produção.
2. Garantir supervisão de processo (container restart policy/orquestrador).
3. Monitorar reinícios e alertar quando ocorrer `Audit unavailable`.

## Backup Automatizado do PostgreSQL (RNF04)

Scripts adicionados:

- `scripts/backup-postgres.sh`
- `scripts/restore-postgres.sh`

Comandos:

1. Executar backup manual:
   - `make backup-db`
2. Restaurar último backup disponível:
   - `make restore-db`
3. Restaurar arquivo específico:
   - `make restore-db FILE=./backups/postgres/postgres_YYYYMMDDTHHMMSSZ.sql.gz`

Configuração:

- `POSTGRES_CONTAINER_NAME` (default: `lframework-postgres`)
- `POSTGRES_BACKUP_DIR` (default: `./backups/postgres`)
- `POSTGRES_BACKUP_RETENTION_DAYS` (default: `30`)
- `POSTGRES_USER` (default: `lframework`)

Automação recomendada:

- Agendar `scripts/backup-postgres.sh` via cron/systemd timer em periodicidade diária.
- Manter retenção mínima de 30 dias para aderência a requisito corporativo.

Templates de agendamento:

- `deploy/cron.backup-postgres.example`
- `deploy/systemd/ca-postgres-backup.service`
- `deploy/systemd/ca-postgres-backup.timer`

## Monitoramento e Alertas Ativos (RNF15)

Stack local de observabilidade:

- `docker-compose.monitoring.yml`
- `monitoring/prometheus.yml`
- `monitoring/alerts.yml`
- `monitoring/alertmanager.yml`

Comandos:

1. Subir monitoramento:
   - `make monitoring-up`
2. Derrubar monitoramento:
   - `make monitoring-down`

Endpoints:

- Prometheus: `http://localhost:9090`
- Alertmanager: `http://localhost:9093`

Regras de alerta configuradas:

- `ServiceDown` (serviço indisponível por > 1 minuto)
- `Api5xxRatioHigh` (taxa de 5xx > 1% por 5 minutos)
- `ApiLatencyP95High` (P95 > 500ms por 5 minutos)

Validação rápida de alertas:

1. Suba os serviços da aplicação + `make monitoring-up`.
2. Acesse Prometheus e confirme targets `UP` na página `/targets`.
3. Induza falha de um serviço e confirme disparo de `ServiceDown`.

### Evidência de validação (2026-05-21)

- Backup PostgreSQL executado com sucesso:
  - arquivo: `./backups/postgres/postgres_20260521T145029Z.sql.gz`
- Alerta `ServiceDown` validado via API interna do Prometheus:
  - consulta: `docker exec lframework-prometheus wget -qO- http://localhost:9090/api/v1/alerts`
  - resultado: alertas em estado `firing` para serviços indisponíveis.
- Ambiente restaurado após teste:
  - `docker start lframework-redis`

## Checklist de Produção (Sprint 1)

- `docs/operacao/ChecklistProducaoSprint1.md`

## Evidências Operacionais Recentes (Sprint 3 e Sprint 4)

- Sprint 3 (Compliance + Notificações):
  - `docs/EvidenciasSprint3.md`
  - Cobertura de evidência: preferências por usuário, supressão `low/medium`, envio obrigatório `high/critical`, fan-out crítico e SLA.

- Sprint 4 (Dashboard KPI + Export auditável):
  - `docs/EvidenciasSprint4.md`
  - Cobertura de evidência:
    - endpoint `GET /api/v1/reports/kpis` com fórmula de conformidade, filtros e `sourceLagSeconds`;
    - export auditável com metadados `requestedBy`, `requestedAtUTC`, `filters`, `format`, `scope`, `exportId`.

## Operação de KPI (RN-061/RN-062/RN-063)

Endpoint:

- `GET /api/v1/reports/kpis`

Parâmetros suportados:

- `period`: `24h` | `7d` | `30d`
- `area`
- `eventType`
- `riskLevel`: `low` | `medium` | `high` | `critical`
- `violationStatus`: `aberta` | `em_analise` | `resolvida` | `dispensada`

Campos relevantes na resposta:

- `complianceIndexPercentage` (fórmula `(compliantEvents / validatedEvents) * 100`)
- `sourceLagSeconds` (defasagem da fonte para validação operacional de atualização)
- `appliedFilters`

## Operação de Export Auditável (RN-064)

Fluxo:

1. Cliente solicita export em `POST /reports/exports` (via BFF).
2. BFF publica evento auditável crítico `bff.reports.export.requested`.
3. Metadados auditáveis incluem:
   - quem: `requestedBy` + `actorId`;
   - quando: `requestedAtUTC`;
   - filtros: `filters`;
   - formato/escopo: `format` e `scope`;
   - vínculo da execução: `exportId`.
4. Download publica evento `bff.reports.export.downloaded`.

Validação automatizada:

- `pnpm --filter bff-service test`
- `pnpm --filter reporting-service test`

# Runbook de Operação e SLO

Data de atualização: 2026-04-08

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

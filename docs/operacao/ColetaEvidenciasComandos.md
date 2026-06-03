# Coleta de Evidências Operacionais (Comandos)

Data: 2026-05-26
Objetivo: facilitar a coleta mensal para `RN-102`, `RNF04`, `RNF15`.

## Execução automatizada (bundle local)

```bash
make evidencias-operacionais
```

Saída:
- `out/evidencias-operacionais/<timestamp>/summary.txt`
- `out/evidencias-operacionais/<timestamp>/rn102_fail_closed.txt`
- `out/evidencias-operacionais/<timestamp>/rnf04_backup.txt`
- `out/evidencias-operacionais/<timestamp>/rnf15_alerting.txt`

## RN-102 — Fail-closed ativo

## 1) Confirmar configuração em ambiente

```bash
printenv | rg '^AUDIT_FAIL_CLOSED='
```

## 2) Validar logs de bootstrap

```bash
docker logs <container> 2>&1 | rg -n "Audit|fail-closed|auditFailClosed"
```

## 3) Simulação controlada (homologação)

```bash
# Exemplo: parar audit service para validar comportamento fail-closed
docker stop lframework-audit-service
docker logs <container> 2>&1 | rg -n "Audit unavailable|Stopping"
# rollback
docker start lframework-audit-service
```

## RNF04 — Backup/restore

## 1) Evidência de agendamento

```bash
crontab -l | rg backup-postgres
systemctl status ca-postgres-backup.timer
systemctl list-timers | rg ca-postgres-backup
```

## 2) Evidência de artefatos e retenção

```bash
ls -lah /var/backups/complice/postgres/postgres_*.sql.gz
find /var/backups/complice/postgres -type f -name 'postgres_*.sql.gz' -mtime +30
```

## 3) Evidência de restore

```bash
./scripts/restore-postgres.sh /var/backups/complice/postgres/postgres_YYYYMMDDTHHMMSSZ.sql.gz
```

## RNF15 — Alertas ativos

## 1) Targets UP

```bash
curl -sS http://localhost:9090/api/v1/targets | jq .
```

## 2) Regras carregadas

```bash
curl -sS http://localhost:9090/api/v1/rules | jq .
```

## 3) Alertas firing/pendentes

```bash
curl -sS http://localhost:9090/api/v1/alerts | jq .
curl -sS http://localhost:9093/api/v2/alerts | jq .
```

## 4) Roteamento Alertmanager

```bash
curl -sS http://localhost:9093/api/v2/status | jq .
```

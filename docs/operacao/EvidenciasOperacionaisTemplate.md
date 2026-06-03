# Evidências Operacionais Mensais (Template)

Mês de referência: `YYYY-MM`  
Ambiente: `produção | homologação`  
Responsável: `nome/equipe`

## 1) RN-102 — Fail-closed de auditoria

## 1.1 Configuração ativa

- `AUDIT_FAIL_CLOSED=true` confirmado nos serviços:
  - [ ] `bff-service`
  - [ ] `risk-analysis-service`
  - [ ] `reporting-service`
  - [ ] `notification-service`
  - [ ] `identity-service`
  - [ ] `compliance-service`
  - [ ] `integration-service`
  - [ ] `audit-service`

Evidência (links/capturas/logs):
- `...`

## 1.2 Teste controlado de indisponibilidade

- [ ] Teste executado em homologação.
- [ ] Comportamento observado compatível com fail-closed (falha/reinício bloqueando operação sem auditoria).
- [ ] Rollback executado e ambiente normalizado.

Evidência:
- `...`

## 2) RNF04 — Backup e restore

## 2.1 Backup diário

- [ ] Agendamento ativo (`cron/systemd/orquestrador`).
- [ ] Execuções diárias confirmadas.

Evidência:
- Lista de artefatos `postgres_*.sql.gz`:
  - `...`
- Logs de execução:
  - `...`

## 2.2 Retenção

- [ ] Retenção mínima de 30 dias ativa.
- [ ] Limpeza de backups antigos validada.

Evidência:
- `...`

## 2.3 Restore amostral

- [ ] Restore testado no mês.
- [ ] Resultado bem-sucedido.

Evidência:
- Arquivo restaurado:
  - `...`
- Logs/comandos de validação:
  - `...`

## 3) RNF15 — Monitoramento e alertas

## 3.1 Saúde dos targets

- [ ] Targets críticos `UP` no Prometheus.

Evidência:
- Captura `/targets`:
  - `...`

## 3.2 Regras e roteamento

- [ ] Regras `ServiceDown`, `Api5xxRatioHigh`, `ApiLatencyP95High` ativas.
- [ ] Receiver/webhook de alerta ativo.

Evidência:
- Export/regras:
  - `...`
- Configuração de roteamento:
  - `...`

## 3.3 Simulado de alerta

- [ ] Alerta disparado.
- [ ] Ack realizado.
- [ ] Resolução registrada.

Evidência:
- Ticket/linha do tempo (disparo, ack, resolução):
  - `...`

## 4) Aprovação mensal

- [ ] Todos os itens obrigatórios preenchidos.
- [ ] Desvios com plano de ação e prazo.

Aprovador técnico: `nome`  
Data: `YYYY-MM-DD`

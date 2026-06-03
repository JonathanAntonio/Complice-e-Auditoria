# Fechamento Mensal Operacional

Data de criação: `2026-05-26`  
Objetivo: formalizar aprovação mensal dos controles `RN-102`, `RNF04` e `RNF15`.

## Identificação do ciclo

- Mês de referência: `YYYY-MM`
- Ambiente avaliado: `produção | homologação`
- Responsável pela execução: `nome/equipe`
- Data de execução: `YYYY-MM-DD`
- Ticket operacional: `link/id`

## Gate 1 — RN-102 (Fail-closed)

- [ ] `AUDIT_FAIL_CLOSED=true` confirmado nos serviços-alvo.
- [ ] Evidência de logs de bootstrap sem erro estrutural de auditoria.
- [ ] Simulação controlada de indisponibilidade executada em homologação.
- [ ] Resultado da simulação registrado (falha controlada + rollback).

Evidências anexadas:
- `...`

## Gate 2 — RNF04 (Backup/Restore)

- [ ] Agendamento diário ativo (cron/systemd/orquestrador).
- [ ] Retenção mínima de 30 dias confirmada.
- [ ] Artefatos de backup do mês anexados.
- [ ] Restore amostral executado com sucesso.

Evidências anexadas:
- `...`

## Gate 3 — RNF15 (Monitoramento/Alertas)

- [ ] Targets críticos `UP` no Prometheus.
- [ ] Regras `ServiceDown`, `Api5xxRatioHigh`, `ApiLatencyP95High` ativas.
- [ ] Roteamento Alertmanager validado.
- [ ] Simulado de alerta com registro de disparo, ack e resolução.

Evidências anexadas:
- `...`

## Pendências e desvios

- [ ] Sem pendências.
- [ ] Com pendências (preencher plano de ação abaixo).

Plano de ação para pendências:
- Desvio:
- Responsável:
- Prazo:
- Mitigação:

## Decisão de fechamento do mês

- [ ] Aprovado sem ressalvas
- [ ] Aprovado com ressalvas
- [ ] Reprovado

Justificativa da decisão:
- `...`

## Assinaturas

- Responsável técnico (nome):
- Cargo/função:
- Data:

- Revisor (nome):
- Cargo/função:
- Data:

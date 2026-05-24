# Pendências Atuais (Pós-fechamento Sprint 4)

Data de corte: 2026-05-24

## Resumo

- Itens completos no checklist: `41`
- Itens parciais no checklist: `75`
- Estado técnico: ciclo de desenvolvimento Sprint 1..4 concluído no baseline atual; pendências principais remanescentes são operacionais em ambiente produtivo.

## Pendências P0 remanescentes (produção/operação)

1. `RN-102` em todos os ambientes produtivos
- Situação: implementado em código com `AUDIT_FAIL_CLOSED=true`.
- Falta: comprovação de ativação contínua no ambiente-alvo.

2. `RNF04` backup automatizado em produção
- Situação: scripts + validação local concluídos.
- Falta: agendamento efetivo (cron/systemd) e evidência contínua.

3. `RNF15` alertas ativos em produção
- Situação: Prometheus/Alertmanager + regras + validação local concluídos.
- Falta: operação contínua e evidência periódica no ambiente-alvo.

## Pendências remanescentes (operação contínua)

1. `RN-102` em produção com evidência contínua
- comprovação periódica de `AUDIT_FAIL_CLOSED=true` ativo em todos os serviços alvo.

2. `RNF04` backup automatizado em produção
- validar agendamento contínuo (cron/systemd/orquestrador) + retenção efetiva.

3. `RNF15` alertas ativos em produção
- validar operação contínua de Prometheus/Alertmanager + evidência de rotas de notificação e resposta.

## Decisão de execução recomendada

1. Encerrar ciclo de desenvolvimento e migrar foco para operação assistida.
2. Manter checklist mensal de evidências operacionais (`backup`, `alertas`, `fail-closed`).
3. Registrar desvios ou incidentes diretamente no runbook e no checklist de produção.

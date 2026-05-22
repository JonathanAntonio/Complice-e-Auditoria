# Pendências Atuais (Corte para Sprint 3)

Data de corte: 2026-05-21

## Resumo

- Itens completos no checklist: `41`
- Itens parciais no checklist: `75`
- Estado técnico: P0 praticamente fechado em nível de aplicação; pendências principais migrando para P1 (compliance/notificações/dashboard) e operação contínua em produção.

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

## Pendências P1 prioritárias (próxima execução)

1. Compliance engine completo (`RF15/RF16`, `RN-030..RN-039`)
- versionamento real de regras ativas;
- justificativa obrigatória de desativação/dispensa;
- aprovação dupla para severidade crítica;
- auditoria completa de transições.

2. Notificação avançada (`RF19`, `RN-050/051/053/055/056`)
- roteamento por estrutura organizacional;
- SLA de 5 minutos para críticas;
- log de entrega detalhado;
- preferências por usuário.

3. Dashboard/KPI (`RF11/12/14`, `RN-061/062/063`)
- fórmula de conformidade no backend;
- latência de atualização validada;
- filtros completos.

## Decisão de execução recomendada

1. Iniciar Sprint 3 por **Compliance + Notificação**.
2. Deixar **Dashboard** para Sprint 4 junto com exportação auditável.
3. Manter `RNF04/RNF15/RN-102` como trilha paralela de operação.

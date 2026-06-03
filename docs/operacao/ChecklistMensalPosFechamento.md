# Checklist Mensal Pós-Fechamento

Data de início: `2026-05-24`  
Objetivo: manter conformidade operacional contínua após encerramento do ciclo de desenvolvimento.

## Escopo

- `RN-102` — operação fail-closed de auditoria em produção.
- `RNF04` — backup automatizado com retenção e teste de restauração.
- `RNF15` — monitoramento e alertas ativos com evidência de resposta.

## Ritos

- Frequência: mensal.
- Janela sugerida: primeira semana de cada mês.
- Evidências: anexar links/IDs de execução em ticket operacional do mês.

## Itens obrigatórios

| Item | Verificação | Evidência mínima | Responsável |
|---|---|---|---|
| RN-102 | `AUDIT_FAIL_CLOSED=true` ativo nos serviços definidos | print/config dump do ambiente + log de bootstrap sem erro de auditoria | SRE / Plataforma |
| RN-102 | Simulação controlada de indisponibilidade de auditoria (ambiente de homologação) | registro de reinício/bloqueio esperado + rollback documentado | SRE / Segurança |
| RNF04 | Execução diária de backup PostgreSQL | lista de artefatos do mês (`postgres_*.sql.gz`) | DBA / SRE |
| RNF04 | Retenção mínima configurada e respeitada | saída de política de retenção + amostra de limpeza | DBA / SRE |
| RNF04 | Teste de restauração (amostral mensal) | evidência de restore bem-sucedido em ambiente de teste | DBA |
| RNF15 | Targets Prometheus `UP` para serviços críticos | captura de `/targets` | Observabilidade |
| RNF15 | Alertas-chave habilitados (`ServiceDown`, `Api5xxRatioHigh`, `ApiLatencyP95High`) | export/captura de regras e estado no Alertmanager | Observabilidade |
| RNF15 | Simulado de alerta e tempo de resposta | ticket com horário de disparo, ack e resolução | Observabilidade / On-call |

## Critério de aprovação mensal

- Todos os itens obrigatórios com evidência anexada.
- Incidentes/desvios registrados com plano de ação e prazo.
- Assinatura de revisão por responsável técnico.

Formulário de aprovação formal:
- `docs/operacao/FechamentoMensalOperacional.md`

## Registro de execuções

| Mês | Status | Responsável | Link evidências | Observações |
|---|---|---|---|---|
| 2026-06 | Pendente | A definir | A definir | Primeira execução pós-fechamento |

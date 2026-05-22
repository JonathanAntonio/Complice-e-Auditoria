# Plano de Fechamento do Projeto

Data: 2026-05-21  
Base: `docs/ChecklistRequisitos.md`, `docs/MatrizRastreabilidadeCodigo.md`, `docs/RBAC-IDENTITY-ROADMAP.md`

## Objetivo

Fechar as lacunas para considerar o projeto completo no baseline atual (OAuth-only), priorizando risco regulatório, segurança e operação em produção.

## Critério de Conclusão

- Todos os itens P0 concluídos e validados por teste.
- Itens P1 concluídos ou formalmente despriorizados com justificativa.
- Checklist de requisitos atualizado com status real.
- Runbook e matriz de rastreabilidade revisados.

## Backlog Priorizado

## P0 (Bloqueadores de produção/compliance)

1. Auditoria imutável forte e completa
- RN-020, RN-021, RN-022, RN-023, RN-024, RN-025, RN-101, RN-102
- Entregas:
  - Garantia append-only no audit log.
  - Campos obrigatórios de auditoria em 100% dos eventos.
  - Estratégia explícita para indisponibilidade do audit service (suspensão/filas seguras).
  - Testes de integração cobrindo escrita auditada e falha do audit service.

2. Segurança de autenticação/sessão e revogação
- RF07, RN-003, RN-004, RN-008, RN-094
- Entregas:
  - Bloqueio após tentativas inválidas com trilha auditável.
  - Encerramento de sessões ao desativar usuário.
  - Revogação de autorização consistente (authz version) em todos os serviços protegidos.

3. RBAC/policy centralizada
- RN-014, RN-015, RN-016, RN-060
- Entregas:
  - Enforcement central via middleware/policy (sem decisão manual espalhada em controller).
  - Cobertura de escopo para auditor externo e compliance officer.
  - Testes automatizados de autorização por papel/permissão.

4. Integração confiável e idempotente
- RF18, RN-070, RN-071, RN-072, RN-073, RN-074, RN-075, RN-076
- Entregas:
  - Idempotência ponta a ponta.
  - Registro de chamadas entrada/saída com status e latência.
  - Retry com backoff e DLQ comprovados em teste.

5. Segurança e operação mínima de produção
- RNF01, RNF02, RNF03, RNF04, RNF15
- Entregas:
  - Rate limit em borda pública.
  - Mascaramento/cripto de sensíveis em logs.
  - Backup automatizado documentado e testado.
  - Alertas ativos para erro, latência e disponibilidade.

## P1 (Fechamento funcional relevante)

1. Compliance engine completo de ciclo de violação
- RF15, RF16, RN-030..RN-039
- Entregas:
  - Versionamento de regra ativa.
  - Justificativa obrigatória em desativação/dispensa.
  - Aprovação dupla para severidade crítica.

2. Dashboard/KPIs e filtros completos
- RF11, RF12, RF14, RN-061, RN-062, RN-063
- Entregas:
  - Fórmula de conformidade implementada no backend.
  - Defasagem máxima de 60s validada.
  - Filtros completos por período/área/risco/status.

3. Notificação avançada
- RF19, RN-050, RN-051, RN-053, RN-055, RN-056
- Entregas:
  - SLA de 5 minutos para críticas.
  - Destinatário por estrutura organizacional.
  - Registro completo de status de entrega.
  - Preferências de notificação por usuário.

4. Exportações auditáveis e governança
- RF13, RN-064
- Entregas:
  - Trilha completa de exportação (quem/quando/filtros/formato).

## P2 (Evolução e maturidade)

1. HA/failover/escalabilidade formal
- RNF12, RNF14, RNF16

2. Otimização de performance e cache avançado
- RNF08, RNF09, RNF10, RNF11

3. Funcionalidades futuras
- RF20 (ML)
- Itens opcionais não críticos para baseline atual.

## Plano de Execução Sugerido (4 Sprints)

1. Sprint 1 (P0 Segurança/Auditoria)
- Itens P0.1, P0.2, P0.5

2. Sprint 2 (P0 RBAC/Integração)
- Itens P0.3, P0.4

3. Sprint 3 (P1 Compliance/Notificação)
- Itens P1.1, P1.3

4. Sprint 4 (P1 Dashboard/Export + fechamento docs)
- Itens P1.2, P1.4
- Atualizar `ChecklistRequisitos`, `MatrizRastreabilidadeCodigo` e `RunbookOperacaoSLO`.

## Definição de Pronto por Item

- Código implementado.
- Testes unitários + integração passando.
- Endpoint/contrato documentado.
- Evidência operacional (health/metrics/logs).
- Rastreabilidade atualizada nos docs.

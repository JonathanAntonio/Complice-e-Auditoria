# Sprints de Fechamento — Complice e Auditoria

Data inicial: 2026-05-21  
Documento de referência: `docs/PlanoFechamentoProjeto.md`

## Como usar este documento

- Atualize o `Status` de cada sprint conforme execução.
- Preencha `Checkpoint` ao fim de cada sessão de trabalho.
- Em novo chat, comece por este arquivo para retomar exatamente do ponto parado.

## Status geral

- Sprint atual: `Sprint 2`
- Progresso geral: `93%`
- Última atualização: `2026-05-21`

---

## Sprint 1 — Segurança, Auditoria e Sessão (P0)

Status: `Concluído (nível aplicação)`  
Objetivo: fechar os riscos mais críticos de compliance e operação.

### Escopo

1. Auditoria imutável forte e completa (`RN-020..RN-025`, `RN-101`, `RN-102`)
2. Segurança de autenticação/sessão e revogação (`RF07`, `RN-003`, `RN-004`, `RN-008`, `RN-094`)
3. Segurança/ops mínima (`RNF01`, `RNF02`, `RNF03`, `RNF04`, `RNF15`)

### Entregáveis

- Garantia append-only real para logs de auditoria.
- Campos obrigatórios de auditoria em 100% dos eventos críticos.
- Estratégia implementada para indisponibilidade do audit service.
- Bloqueio por tentativas inválidas + auditoria do bloqueio.
- Encerramento de sessão ao desativar usuário.
- Rate limit em borda pública e mascaramento/cripto de dados sensíveis nos logs.
- Backup automatizado documentado e testado.
- Alertas ativos para latência, erro e disponibilidade.

### Critérios de aceite

- Testes unitários e integração cobrindo cenários de sucesso/falha.
- Evidência operacional via `/health` e `/metrics`.
- Atualização de `ChecklistRequisitos` e `MatrizRastreabilidadeCodigo`.

### Checkpoint

- Último ponto: `Escopo técnico concluído; pendências residuais são operacionais em ambiente produtivo (RN-102, RNF04, RNF15)`
- Próxima tarefa: `Manter trilha operacional paralela enquanto Sprint 2/3 avançam`
- Bloqueios: `Nenhum`

---

## Sprint 2 — RBAC e Integração Confiável (P0)

Status: `Em andamento`  
Objetivo: fechar autorização centralizada e integração robusta/idempotente.

### Escopo

1. RBAC/policy centralizada (`RN-014`, `RN-015`, `RN-016`, `RN-060`)
2. Integração autenticada, validada e idempotente (`RF18`, `RN-070..RN-076`)

### Entregáveis

- Policy enforcement central no `shared` (sem regras críticas espalhadas em controllers).
- Cobertura de escopo para perfis sensíveis (auditor externo / compliance officer).
- Idempotência ponta a ponta para eventos de integração.
- Registro detalhado de chamadas de entrada e saída (status/latência).
- Retry com backoff + DLQ comprovados.

### Critérios de aceite

- Suite automatizada de autorização por papel/permissão.
- Suite automatizada de integração com replay de evento e cenário de falha.
- Contratos e documentação atualizados.

### Checkpoint

- Último ponto: `Integração inbound/outbound com trilha auditável reforçada e testes (routes + outbox relay)`
- Próxima tarefa: `Consolidar escopo RBAC residual (RN-014/015/016/060) ou formalizar desvio para Sprint 3`
- Bloqueios: `Nenhum`

---

## Sprint 3 — Compliance e Notificações (P1)

Status: `Não iniciado`  
Objetivo: fechar ciclo de violações e alertas com requisitos de negócio.

### Escopo

1. Compliance engine completo (`RF15`, `RF16`, `RN-030..RN-039`)
2. Notificação avançada (`RF19`, `RN-050`, `RN-051`, `RN-053`, `RN-055`, `RN-056`)

### Entregáveis

- Versionamento de regra ativa.
- Justificativa obrigatória para desativação/dispensa.
- Aprovação dupla para violações críticas.
- SLA de notificação crítica em até 5 minutos.
- Destinatários por perfil e estrutura organizacional.
- Log completo de entrega e preferências de notificação.

### Critérios de aceite

- Testes cobrindo workflow completo de violação.
- Testes cobrindo retries, SLA e roteamento de destinatários.
- Evidências de auditoria de transições e envios.

### Checkpoint

- Último ponto: `A iniciar`
- Próxima tarefa: `Fechar machine de estados de violação com auditoria completa`
- Bloqueios: `Nenhum`

---

## Sprint 4 — Dashboard, Export e Fechamento de Documentação (P1)

Status: `Não iniciado`  
Objetivo: fechar visão executiva, rastreabilidade e encerramento formal.

### Escopo

1. Dashboard/KPIs/filtros (`RF11`, `RF12`, `RF14`, `RN-061`, `RN-062`, `RN-063`)
2. Exportação auditável (`RF13`, `RN-064`)
3. Fechamento documental e evidências finais

### Entregáveis

- Fórmula de conformidade implementada no backend.
- Defasagem de KPI <= 60s validada.
- Filtros completos conforme requisito.
- Export auditado com metadados completos.
- Atualização final de:
  - `docs/ChecklistRequisitos.md`
  - `docs/MatrizRastreabilidadeCodigo.md`
  - `docs/RunbookOperacaoSLO.md`
  - este arquivo (`docs/SprintsFechamento.md`)

### Critérios de aceite

- Testes e2e do fluxo principal e cenários de dashboard/export.
- Evidência de rastreabilidade requisito -> código -> teste -> operação.

### Checkpoint

- Último ponto: `A iniciar`
- Próxima tarefa: `Consolidar fonte dos KPIs no reporting-service e validar latência`
- Bloqueios: `Nenhum`

---

## Registro de Sessões

| Data | Sprint | O que foi feito | Próximo passo | Responsável |
|---|---|---|---|---|
| 2026-05-21 | Sprint 1 | Planejamento criado + append-only no `audit_logs` + fail-closed de auditoria em HTTP/RabbitMQ + login fail-closed + RN-094 validado por testes + checklist/matriz atualizados + stack de backup/monitoramento adicionada + validação prática executada + critérios de produção formalizados | Sprint 2: expandir trilha auditável para integrações de saída (outbound) | Codex + Levi |

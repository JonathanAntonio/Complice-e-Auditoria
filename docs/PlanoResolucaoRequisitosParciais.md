# Plano de Resolução dos Requisitos Parciais

Data: 2026-05-26
Base: `docs/ChecklistRequisitos.md` + `docs/MatrizRastreabilidadeCodigo.md` + `docs/PendenciasAtuais.md`

## 1) Objetivo

Fechar todos os requisitos marcados como `Parcial`/`Parcial*` no checklist, com evidência técnica e operacional suficiente para reclassificação para `Completo` (ou `Descontinuado`, quando aplicável por baseline).

## 2) Estratégia de execução

1. Normalizar baseline e remover divergências de status entre checklist e matriz.
2. Fechar primeiro pendências operacionais críticas de produção (`RN-102`, `RNF04`, `RNF15`).
3. Fechar lacunas funcionais e de regras por trilha (Identidade, Auditoria, Compliance, Integração, Reporting, Infra).
4. Exigir para cada requisito: implementação, teste automatizado e evidência operacional.

## 3) Backlog consolidado por trilha

## 3.1 Governança e Baseline

- Escopo: `RF04`, divergências `RF13`, `RF15`, `RF16`, `RN-070..RN-074`, `RN-084`.
- Ações:
1. Revisar status oficial por requisito e atualizar `ChecklistRequisitos.md`.
2. Quando descontinuado (ex.: `RF04` OAuth-only), registrar justificativa formal e critério de não aplicação.
3. Publicar fonte única de verdade para status (checklist + matriz sincronizados).
- Evidência:
1. PR/documento de decisão de baseline.
2. Checklist e matriz sem conflito de status.

## 3.2 Operação em Produção (P0)

- Escopo: `RN-102`, `RNF04`, `RNF15`.
- Ações:
1. `RN-102`: validar `AUDIT_FAIL_CLOSED=true` ativo em todos os serviços alvo e ambientes.
2. `RNF04`: implantar agendamento de backup (cron/systemd/orquestrador), retenção e restauração testada.
3. `RNF15`: colocar alertas e rotas de notificação em operação contínua (Prometheus/Alertmanager).
4. Criar checklist mensal de evidências operacionais.
- Evidência:
1. Capturas/configs de ambiente.
2. Logs de execução periódica (backup/alertas/fail-closed).
3. Teste real de restore com timestamp e resultado.

## 3.3 Identidade e Acesso

- Escopo: `RF01`, `RN-007`, `RN-014`, `RN-015`, `RN-016`, `RN-090`, `RN-093`, `RN-095`.
- Ações:
1. Finalizar fluxos pendentes de ciclo de vida de usuários e restrições por perfil.
2. Garantir regras de governança de administração e trilha de auditoria para mudança de permissões.
3. Cobrir obrigatoriedade de dados de usuário e regras de segurança administrativas.
- Evidência:
1. Testes unitários/integrados para cenários positivos e negativos.
2. Logs de auditoria para operações administrativas.

## 3.4 Auditoria e Imutabilidade

- Escopo: `RF08`, `RN-020`, `RN-021`, `RN-022`, `RN-023`, `RN-024`, `RN-025`, `RN-026`, `RN-027`, `RN-100`, `RN-101`, `RN-104`.
- Ações:
1. Completar cobertura de campos mínimos e origem de eventos externos.
2. Reforçar garantia de auditoria antes de escrita efetiva em operações críticas.
3. Garantir rastreabilidade cronológica e mascaramento/criptografia de sensíveis no log.
4. Assegurar regra de “nenhuma escrita sem auditoria” em todos os serviços com mutação.
- Evidência:
1. Testes de contrato e integração por serviço.
2. Auditorias de fluxo ponta-a-ponta com validação de payloads.

## 3.5 Compliance Engine e Ciclo de Violação

- Escopo: `RN-030`, `RN-031`, `RN-032`, `RN-033`, `RN-034`, `RN-036`, `RN-039`, `RN-043`, `RN-050`.
- Ações:
1. Fechar regras de ciclo de vida (ativação/versionamento/justificativa/transição).
2. Validar SLA de início de análise por severidade e alerta de área crítica >24h.
3. Garantir geração e despacho de notificação para toda violação conforme regra.
- Evidência:
1. Cenários automatizados de ciclo completo da violação.
2. Métricas/SLO por severidade e alarmes.

## 3.6 Reporting e Escopo de Visualização

- Escopo: `RN-060`.
- Ações:
1. Implementar escopo organizacional completo (área/unidade/perfil) no backend.
2. Validar filtros e recortes por permissão no frontend e BFF.
- Evidência:
1. Testes de autorização por escopo.
2. Demonstração com múltiplos perfis e unidades.

## 3.7 Integração e Mensageria

- Escopo: `RF18`, `RN-070`, `RN-071`, `RN-072`, `RN-073`, `RN-074`, `RN-075`, `RN-076`.
- Ações:
1. Fechar bidirecionalidade real com conectores externos prioritários.
2. Garantir autenticação, validação semântica e idempotência em todos os endpoints.
3. Cobrir timeout/retry/backoff/DLQ com observabilidade de falhas e reprocesso.
4. Auditar mudanças de integração.
- Evidência:
1. Testes de integração com mock e com ambiente de homologação.
2. Painel de filas e DLQ com KPIs de reprocessamento.

## 3.8 Segurança, Performance e Resiliência

- Escopo: `RNF01`, `RNF02`, `RNF03`, `RNF05`, `RNF06`, `RNF07`, `RNF08`, `RNF09`, `RNF10`, `RNF11`, `RNF12`, `RNF14`, `RNF16`.
- Ações:
1. Formalizar controles técnicos por requisito (hardening, segurança, performance, HA/failover).
2. Executar bateria de testes de carga, segurança e resiliência.
3. Documentar limites, tuning e plano de capacidade por serviço crítico.
- Evidência:
1. Relatórios de benchmark (p95), scans de segurança e testes de failover.
2. Runbooks atualizados e aprovados.

## 3.9 Evolução Avançada de Produto

- Escopo: `RF20`.
- Ações:
1. Definir se ML será implementado no ciclo atual ou movido para roadmap com critérios objetivos.
2. Se implementado: pipeline mínimo de detecção, explicabilidade e monitoramento de drift.
- Evidência:
1. Documento de decisão arquitetural.
2. Prova de conceito com métricas de qualidade.

## 4) Critério de saída por requisito

Um requisito só muda de `Parcial` para `Completo` quando cumprir todos:

1. Implementação funcional no código.
2. Teste automatizado cobrindo cenário principal e falhas.
3. Evidência operacional (quando aplicável em produção).
4. Atualização de documentação de status e rastreabilidade.

## 5) Sequência recomendada (ondas)

1. Onda 1 (P0): `RN-102`, `RNF04`, `RNF15`, alinhamento de baseline/documentação.
2. Onda 2: Auditoria + Identidade (maior risco regulatório).
3. Onda 3: Compliance + Integração bidirecional + Mensageria.
4. Onda 4: Performance/HA/Failover e fechamento de requisitos não funcionais remanescentes.
5. Onda 5: `RF20` (ML) como entrega dedicada ou descontinuação formal.

## 6) Entregáveis de gestão

1. Quadro de acompanhamento por requisito (`ID`, `owner`, `prazo`, `status`, `evidência`).
2. Checklist mensal operacional (backup, alertas, fail-closed).
3. Relatório final de fechamento com diff de status e links de evidência.

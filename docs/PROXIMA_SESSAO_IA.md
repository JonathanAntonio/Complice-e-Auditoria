# Handoff — Próxima Sessão IA

Data: 2026-05-22
Projeto: Complice-e-Auditoria
Sprint atual: Sprint 3 (Compliance e Notificações)

## Estado atual

- Sprint 1 e 2: avanços principais já registrados em `docs/SprintsFechamento.md`.
- Compliance:
  - Regras de dispensa de violação implementadas (justificativa obrigatória + aprovação para crítico).
  - Severidade `critica` aplicada em validação/controller/OpenAPI.
  - Integração `compliance-service -> notification-service` implementada para violações críticas (best-effort).
- Notification:
  - Roteamento por estrutura já iniciado (`scopeOwner`, `areaManager`, `complianceOfficer`).
  - SLA crítico (5 min) já iniciado no log com campos:
    - `slaTargetSeconds`
    - `slaDeadlineUTC`
    - `slaBreached`

## Bloqueio encontrado

- A sessão anterior ficou sem executor shell funcional (`os error 2` ao abrir processo).
- Parte do RN-056 foi iniciada e pode ter ficado parcialmente aplicada.

## Próximos passos imediatos (ordem recomendada)

1. Validar estado real dos arquivos de notificação:
   - `packages/notification-service/src/application/notification-dispatch.service.ts`
   - `packages/notification-service/src/application/notification-preferences.service.ts`
   - `packages/notification-service/src/adapters/driving/http/routes.ts`
   - `packages/notification-service/src/index.ts`
   - `packages/notification-service/src/openapi.ts`

2. Fechar RN-056 (preferências por usuário):
   - Garantir serviço de preferências com upsert/get por destinatário.
   - Expor endpoints:
     - `PUT /api/v1/notifications/preferences/:recipient`
     - `GET /api/v1/notifications/preferences/:recipient`
   - Regra obrigatória: preferências NÃO podem desativar alertas `high/critical`.

3. Aplicar preferências no roteamento (RN-053/RN-056):
   - `low/medium`: podem ser reduzidos por preferência (canal/mute).
   - `high/critical`: envio sempre obrigatório.

4. Ajustar bootstrap/injeção:
   - Injetar `NotificationPreferencesService` no `NotificationDispatchService` e nas rotas.

5. Testes:
   - `pnpm --filter notification-service test`
   - `pnpm --filter compliance-service test`
   - Adicionar/ajustar testes para preferências + roteamento.

6. Documentação:
   - Atualizar `docs/SprintsFechamento.md` com:
     - o que foi concluído no RN-056;
     - pendências restantes da Sprint 3.

## Critério de pronto para este bloco

- Preferências de notificação funcionais por usuário.
- Roteamento respeitando RN-056 sem violar envio obrigatório de `high/critical`.
- Testes verdes nos serviços impactados.
- Checkpoint atualizado em `docs/SprintsFechamento.md`.

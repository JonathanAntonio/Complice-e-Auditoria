# Evidências Operacionais — Sprint 3

Data da coleta: `2026-05-22`  
Projeto: `Complice-e-Auditoria`  
Serviços usados: `compliance-service (4002)` e `notification-service (4008)`

## 1) Health dos serviços

Request:
```bash
curl -sS http://localhost:4002/health
curl -sS http://localhost:4008/health
```

Response:
```json
{"status":"ok","service":"compliance-service"}
{"status":"ok","service":"notification-service"}
```

## 2) Preferências de notificação por usuário (RN-056)

### 2.1 PUT preferências
Request:
```bash
curl -X PUT 'http://localhost:4008/api/v1/notifications/preferences/evidence.user%40example.com' \
  -H 'content-type: application/json' \
  --data '{"channels":["webhook"],"frequency":"daily_digest","grouping":true,"muteLowMedium":true}'
```

Response:
```json
{"recipient":"evidence.user@example.com","channels":["webhook"],"frequency":"daily_digest","grouping":true,"muteLowMedium":true,"updatedAtUTC":"2026-05-22T14:59:11.715Z"}
```

### 2.2 GET preferências
Request:
```bash
curl -X GET 'http://localhost:4008/api/v1/notifications/preferences/evidence.user%40example.com'
```

Response:
```json
{"recipient":"evidence.user@example.com","channels":["webhook"],"frequency":"daily_digest","grouping":true,"muteLowMedium":true,"updatedAtUTC":"2026-05-22T14:59:11.715Z"}
```

## 3) Aplicação de preferências no roteamento (RN-053/RN-056)

### 3.1 Severidade low deve respeitar preferência (suprimir envio)
Request:
```bash
curl -X POST 'http://localhost:4008/api/v1/notifications/dispatch' \
  -H 'content-type: application/json' \
  --data '{"channel":"email","recipient":"evidence.user@example.com","severity":"low","message":"Low severity evidence message"}'
```

Response:
```json
{"status":"skipped_by_preferences","dispatchedCount":0}
```

### 3.2 Severidade high deve ser obrigatória (não suprimir)
Request:
```bash
curl -X POST 'http://localhost:4008/api/v1/notifications/dispatch' \
  -H 'content-type: application/json' \
  --data '{"channel":"email","recipient":"evidence.user@example.com","severity":"high","message":"High severity evidence message"}'
```

Response:
```json
{"id":"25cd6458-2ef9-4abe-909c-73eaf9cdf125","channel":"email","recipient":"evidence.user@example.com","severity":"high","status":"sent","attempts":1,"createdAtUTC":"2026-05-22T14:59:13.304Z","deliveredAtUTC":"2026-05-22T14:59:13.304Z","dispatchedCount":1}
```

## 4) Integração compliance -> notification para crítico

### 4.1 Criar violação crítica no compliance
Request:
```bash
curl -X POST 'http://localhost:4002/api/violations' \
  -H 'authorization: Bearer <JWT_VALIDO>' \
  -H 'content-type: application/json' \
  --data '{"title":"Evidencia fluxo critico sprint 3","severity":"critica"}'
```

Response:
```json
{"id":"2119ac5f-8f03-41f2-bb09-501907e21ae5","title":"Evidencia fluxo critico sprint 3","severity":"critica","status":"aberta","resolvedAt":null,"dismissedAt":null,"dismissalJustification":null,"dismissalApprovedBy":null,"retentionUntil":null,"createdAt":"2026-05-22T15:00:17.643Z"}
```

### 4.2 Verificar logs críticos no notification
Request:
```bash
curl -X GET 'http://localhost:4008/api/v1/notifications/logs'
```

Trecho relevante da response:
```json
[
  {"recipient":"scope-owner@company.local","severity":"critical","status":"sent","slaTargetSeconds":300,"slaDeadlineUTC":"2026-05-22T15:05:18.074Z","slaBreached":false},
  {"recipient":"area-manager@company.local","severity":"critical","status":"sent","slaTargetSeconds":300,"slaDeadlineUTC":"2026-05-22T15:05:18.074Z","slaBreached":false},
  {"recipient":"compliance-officer@company.local","severity":"critical","status":"sent","slaTargetSeconds":300,"slaDeadlineUTC":"2026-05-22T15:05:18.074Z","slaBreached":false}
]
```

## Conclusão

- Preferências por usuário persistidas e consultáveis via API.
- `low/medium` respeitam redução por preferência.
- `high/critical` continuam obrigatórios.
- Violação crítica no compliance gera fan-out automático no notification com SLA de 5 minutos registrado.

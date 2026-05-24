# Evidências Operacionais — Sprint 4

Data da coleta: `2026-05-24`  
Serviço: `reporting-service` (`http://localhost:4007`)

## 1) Endpoint de KPI para dashboard (RN-061/RN-062/RN-063)

Request padrão:
```bash
curl -sS 'http://localhost:4007/api/v1/reports/kpis'
```

Response:
```json
{"generatedAtUTC":"2026-05-24T15:54:51.164Z","sourceLagSeconds":40,"appliedFilters":{"period":"24h"},"totals":{"validatedEvents":5,"compliantEvents":3,"nonCompliantEvents":2},"complianceIndexPercentage":60,"violationsByStatus":{"aberta":1,"em_analise":1,"resolvida":2,"dispensada":1},"riskDistribution":{"low":1,"medium":2,"high":1,"critical":1}}
```

Validação observável:
- Fórmula de conformidade aplicada: `3/5 * 100 = 60`.
- Defasagem reportada no payload: `sourceLagSeconds=40` (<= 60).

Request filtrado:
```bash
curl -sS 'http://localhost:4007/api/v1/reports/kpis?period=24h&area=finance&eventType=invoice_updated&riskLevel=high&violationStatus=aberta'
```

Response:
```json
{"generatedAtUTC":"2026-05-24T15:54:51.176Z","sourceLagSeconds":15,"appliedFilters":{"period":"24h","area":"finance","eventType":"invoice_updated","riskLevel":"high","violationStatus":"aberta"},"totals":{"validatedEvents":1,"compliantEvents":0,"nonCompliantEvents":1},"complianceIndexPercentage":0,"violationsByStatus":{"aberta":1,"em_analise":0,"resolvida":0,"dispensada":0},"riskDistribution":{"low":0,"medium":0,"high":1,"critical":0}}
```

Validação observável:
- Filtros de período/área/tipo de evento/nível de risco/status aplicados e refletidos em `appliedFilters`.
- Resultado compatível com subconjunto filtrado (`validatedEvents=1`).

## 2) Validação automatizada

Comando:
```bash
pnpm --filter reporting-service test
```

Resultado:
- `2` arquivos de teste aprovados.
- `5` testes aprovados.
- Cobertura de:
  - fórmula de conformidade;
  - aplicação de filtros;
  - validação de query inválida.

## 3) Exportação auditável (RN-064)

Fluxo de exportação no BFF:
- Endpoint de criação: `POST /reports/exports`.
- Publicação de evento auditável crítico: `bff.reports.export.requested`.

Evidência de payload auditável (teste automatizado em `auth.handlers.spec.ts`):
- `exportId`
- `scope`
- `format`
- `requestedBy` (quem solicitou)
- `requestedAtUTC` (quando solicitou)
- `filters` (filtros aplicados)
- `status`

Comando de validação:
```bash
pnpm --filter bff-service test
```

Resultado:
- `7` arquivos de teste aprovados.
- `35` testes aprovados.
- Cenário específico de exportação confirma publicação auditável com metadados completos de RN-064.

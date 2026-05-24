export function createNotificationOpenApi(baseUrl: string): object {
  return {
    openapi: "3.0.3",
    info: {
      title: "Notification Service API",
      version: "1.0.0",
      description: "Despacho de notificações por email/webhook e trilha de entrega.",
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/api/v1/notifications/dispatch": {
        post: {
          summary: "Dispatch notification",
          description:
            "Aceita recipient direto ou roteamento por contexto (scopeOwner/areaManager/complianceOfficer). " +
            "Para severidade high: areaManager obrigatório quando recipient não é informado. " +
            "Para critical: areaManager e complianceOfficer obrigatórios quando recipient não é informado. " +
            "Logs críticos incluem SLA de 5 minutos (slaTargetSeconds/slaDeadlineUTC/slaBreached).",
          responses: {
            "202": { description: "Accepted" },
            "400": { description: "Validation error" },
          },
        },
      },
      "/api/v1/notifications/logs": {
        get: {
          summary: "List notification logs",
          responses: {
            "200": { description: "OK" },
          },
        },
      },
      "/api/v1/notifications/preferences/{recipient}": {
        put: {
          summary: "Upsert notification preferences by recipient",
          description:
            "Atualiza preferências por destinatário. Preferências impactam apenas low/medium. " +
            "Alertas high/critical são sempre obrigatórios.",
          parameters: [
            {
              name: "recipient",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { description: "Updated" },
            "400": { description: "Validation error" },
          },
        },
        get: {
          summary: "Get notification preferences by recipient",
          parameters: [
            {
              name: "recipient",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { description: "OK" },
            "404": { description: "Not found" },
          },
        },
      },
      "/health": {
        get: {
          summary: "Health check",
          responses: { "200": { description: "Service healthy" } },
        },
      },
    },
  };
}

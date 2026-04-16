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
      "/health": {
        get: {
          summary: "Health check",
          responses: { "200": { description: "Service healthy" } },
        },
      },
    },
  };
}

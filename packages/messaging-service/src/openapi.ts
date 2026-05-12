export function createMessagingOpenApi(baseUrl: string) {
  return {
    openapi: "3.0.3",
    info: {
      title: "Messaging Service API",
      version: "1.0.0",
      description: "Agregador de observabilidade do fluxo de mensageria.",
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/api/v1/messaging/flow": {
        get: {
          summary: "Obtém resumo do fluxo de mensageria",
          responses: {
            "200": { description: "Resumo retornado com sucesso." },
          },
        },
      },
      "/health": {
        get: {
          summary: "Health check",
          responses: {
            "200": { description: "Serviço saudável." },
          },
        },
      },
    },
  };
}

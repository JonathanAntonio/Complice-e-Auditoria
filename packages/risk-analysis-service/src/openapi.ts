export function createRiskOpenApi(baseUrl: string): object {
  return {
    openapi: "3.0.3",
    info: {
      title: "Risk Analysis Service API",
      version: "1.0.0",
      description: "Cálculo e consulta de pontuações de risco.",
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/api/v1/risk/events": {
        post: {
          summary: "Ingest risk-relevant event",
          responses: {
            "202": { description: "Accepted" },
            "400": { description: "Validation error" },
          },
        },
      },
      "/api/v1/risk/scores": {
        get: {
          summary: "List risk scores with filters and pagination",
          responses: {
            "200": { description: "OK" },
          },
        },
      },
      "/api/v1/risk/scores/{entityType}/{entityId}/history": {
        get: {
          summary: "Get risk score history for an entity",
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

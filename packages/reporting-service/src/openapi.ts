export function createReportingOpenApi(baseUrl: string): object {
  return {
    openapi: "3.0.3",
    info: {
      title: "Reporting Service API",
      version: "1.0.0",
      description: "Geração e consulta de exportações de relatórios.",
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/api/v1/reports/kpis": {
        get: {
          summary: "Get dashboard KPI snapshot",
          description:
            "Retorna snapshot de KPIs com fórmula de conformidade (eventos conformes / eventos validados * 100), " +
            "filtros por período/área/tipo de evento/nível de risco/status de violação e metadado de defasagem (sourceLagSeconds).",
          responses: {
            "200": { description: "OK" },
            "400": { description: "Validation error" },
          },
        },
      },
      "/api/v1/reports/exports": {
        post: {
          summary: "Create export job",
          responses: {
            "201": { description: "Created" },
            "400": { description: "Validation error" },
          },
        },
      },
      "/api/v1/reports/exports/{id}": {
        get: {
          summary: "Get export job by id",
          responses: {
            "200": { description: "OK" },
            "404": { description: "Not found" },
          },
        },
      },
      "/api/v1/reports/exports/{id}/download": {
        get: {
          summary: "Download export file",
          responses: {
            "200": { description: "File download" },
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

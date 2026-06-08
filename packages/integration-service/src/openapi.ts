export interface IntegrationOpenApiSpec {
  openapi: "3.0.3";
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string; description?: string }>;
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey";
        in: "header";
        name: "x-api-key";
      };
    };
    schemas: Record<string, unknown>;
  };
  paths: Record<string, unknown>;
}

export function createIntegrationOpenApi(baseUrl: string): IntegrationOpenApiSpec {
  return {
    openapi: "3.0.3",
    info: {
      title: "Integration Service API",
      version: "1.0.0",
      description: "Inbound events API com Event Envelope v1, autenticação por API Key e rate limit.",
    },
    servers: [{ url: baseUrl }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
      },
      schemas: {
        EventEnvelopeV1: {
          type: "object",
          additionalProperties: false,
          required: [
            "eventId",
            "type",
            "occurredAtUTC",
            "producer",
            "correlationId",
            "payload",
            "version",
          ],
          properties: {
            eventId: { type: "string", format: "uuid" },
            type: { type: "string", minLength: 1 },
            occurredAtUTC: { type: "string", format: "date-time" },
            producer: { type: "string", minLength: 1 },
            correlationId: { type: "string", minLength: 1 },
            payload: { type: "object", additionalProperties: true },
            version: { type: "string", enum: ["1.0"] },
          },
        },
        AcceptedResponse: {
          type: "object",
          additionalProperties: false,
          required: ["accepted", "duplicate", "eventId"],
          properties: {
            accepted: { type: "boolean" },
            duplicate: { type: "boolean" },
            eventId: { type: "string", format: "uuid" },
          },
        },
        ErrorResponse: {
          type: "object",
          additionalProperties: false,
          required: ["error", "message"],
          properties: {
            error: { type: "string" },
            message: { type: "string" },
          },
        },
        HealthResponse: {
          type: "object",
          additionalProperties: false,
          required: ["status", "service"],
          properties: {
            status: { type: "string", enum: ["ok"] },
            service: { type: "string", enum: ["integration-service"] },
          },
        },
        CreateViolationBody: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string", minLength: 3, maxLength: 120 },
            severity: { type: "string", enum: ["baixa", "media", "alta", "critica"], default: "media" },
          },
        },
        ViolationResponse: {
          type: "object",
          required: ["id", "title", "severity", "status", "createdAt"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            severity: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
            status: { type: "string", enum: ["aberta", "em_analise", "resolvida", "dispensada"] },
            resolvedAt: { type: "string", format: "date-time", nullable: true },
            dismissedAt: { type: "string", format: "date-time", nullable: true },
            dismissalJustification: { type: "string", nullable: true },
            dismissalApprovedBy: { type: "string", nullable: true },
            retentionUntil: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    paths: {
      "/api/integrations/events": {
        post: {
          summary: "Ingest event envelope",
          description: "Valida envelope v1, aplica idempotência por eventId e persiste em outbox para publicação assíncrona.",
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EventEnvelopeV1" },
              },
            },
          },
          responses: {
            "202": {
              description: "Evento aceito para publicação assíncrona.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AcceptedResponse" },
                },
              },
            },
            "200": {
              description: "Evento duplicado, tratado por idempotência.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AcceptedResponse" },
                },
              },
            },
            "400": {
              description: "Envelope inválido.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "401": {
              description: "API Key ausente ou inválida.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "429": {
              description: "Rate limit excedido.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/integrations/compliance/violations": {
        get: {
          summary: "List compliance violations",
          description: "Consulta violações do compliance-service usando autenticação por API key.",
          security: [{ ApiKeyAuth: [] }],
          responses: {
            "200": {
              description: "Lista de violações retornada com sucesso.",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ViolationResponse" },
                  },
                },
              },
            },
            "401": {
              description: "API Key ausente ou inválida.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "502": {
              description: "Serviço de compliance indisponível.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          summary: "Create compliance violation",
          description: "Cria uma nova violação no compliance-service usando autenticação por API key.",
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateViolationBody" },
              },
            },
          },
          responses: {
            "201": {
              description: "Violação criada com sucesso.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ViolationResponse" },
                },
              },
            },
            "400": {
              description: "Payload de criação inválido.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "401": {
              description: "API Key ausente ou inválida.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "502": {
              description: "Serviço de compliance indisponível.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/integrations/risk/scores": {
        get: {
          summary: "List risk scores",
          description: "Consulta pontuações de risco do risk-analysis-service usando autenticação por API key.",
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: "entityType", in: "query", schema: { type: "string", enum: ["user", "area", "process"] } },
            { name: "level", in: "query", schema: { type: "string", enum: ["low", "medium", "high", "critical"] } },
          ],
          responses: {
            "200": {
              description: "Pontuações de risco retornadas com sucesso.",
            },
            "401": {
              description: "API Key ausente ou inválida.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "502": {
              description: "Serviço de análise de risco indisponível.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/integrations/audit/logs": {
        get: {
          summary: "List audit logs",
          description: "Consulta logs de auditoria do audit-service usando autenticação por API key.",
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", default: 20 } },
          ],
          responses: {
            "200": {
              description: "Logs de auditoria retornados com sucesso.",
            },
            "401": {
              description: "API Key ausente ou inválida.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "502": {
              description: "Serviço de auditoria indisponível.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/health": {
        get: {
          summary: "Health check",
          responses: {
            "200": {
              description: "Serviço saudável.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                },
              },
            },
          },
        },
      },
    },
  };
}

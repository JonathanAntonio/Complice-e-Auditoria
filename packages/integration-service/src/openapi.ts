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

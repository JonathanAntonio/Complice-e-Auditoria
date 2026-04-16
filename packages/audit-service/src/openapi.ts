export function createAuditOpenApi(baseUrl: string) {
  return {
    openapi: "3.0.3",
    info: {
      title: "Audit Service API",
      version: "1.0.0",
      description: "Leitura de logs de auditoria com filtros e paginação.",
    },
    servers: [{ url: baseUrl }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        AuditLogItem: {
          type: "object",
          required: [
            "eventId",
            "eventType",
            "occurredAtUTC",
            "recordedAtUTC",
            "sourceService",
            "correlationId",
            "severity",
            "payload",
          ],
          properties: {
            eventId: { type: "string", format: "uuid" },
            eventType: { type: "string" },
            occurredAtUTC: { type: "string", format: "date-time" },
            recordedAtUTC: { type: "string", format: "date-time" },
            actorId: { type: ["string", "null"] },
            actorType: { type: ["string", "null"] },
            sourceService: { type: "string" },
            correlationId: { type: "string" },
            severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
            payload: { type: "object", additionalProperties: true },
          },
        },
        AuditLogListResponse: {
          type: "object",
          required: ["items", "page", "pageSize", "total"],
          properties: {
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/AuditLogItem" },
            },
            page: { type: "integer", minimum: 1 },
            pageSize: { type: "integer", minimum: 1 },
            total: { type: "integer", minimum: 0 },
          },
        },
        RetentionRunItem: {
          type: "object",
          required: [
            "id",
            "startedAt",
            "status",
            "retentionDays",
            "cutoffAt",
            "scannedCount",
            "eligibleCount",
            "monitorOnlyCount",
          ],
          properties: {
            id: { type: "string", format: "uuid" },
            startedAt: { type: "string", format: "date-time" },
            finishedAt: { type: ["string", "null"], format: "date-time" },
            status: { type: "string", enum: ["running", "success", "failed"] },
            retentionDays: { type: "integer", minimum: 1 },
            cutoffAt: { type: "string", format: "date-time" },
            scannedCount: { type: "integer", minimum: 0 },
            eligibleCount: { type: "integer", minimum: 0 },
            monitorOnlyCount: { type: "integer", minimum: 0 },
            errorMessage: { type: ["string", "null"] },
          },
        },
        RetentionRunListResponse: {
          type: "object",
          required: ["items", "page", "pageSize", "total"],
          properties: {
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/RetentionRunItem" },
            },
            page: { type: "integer", minimum: 1 },
            pageSize: { type: "integer", minimum: 1 },
            total: { type: "integer", minimum: 0 },
          },
        },
        ErrorResponse: {
          type: "object",
          required: ["error", "message"],
          properties: {
            error: { type: "string" },
            message: { type: "string" },
          },
        },
      },
    },
    paths: {
      "/api/audit/logs": {
        get: {
          summary: "List audit logs",
          description: "Exige autenticação JWT e permissão audit.logs.read.any ou audit.logs.read.scoped.",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
            { name: "type", in: "query", schema: { type: "string" } },
            { name: "actorId", in: "query", schema: { type: "string" } },
            { name: "severity", in: "query", schema: { type: "string", enum: ["low", "medium", "high", "critical"] } },
            { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
            { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
          ],
          responses: {
            "200": {
              description: "Audit logs list",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuditLogListResponse" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            "403": {
              description: "Forbidden",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
          },
        },
      },
      "/api/audit/retention/runs": {
        get: {
          summary: "List retention runs",
          description: "Exige autenticação JWT e permissão audit.logs.read.any ou audit.logs.read.scoped.",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
            { name: "status", in: "query", schema: { type: "string", enum: ["running", "success", "failed"] } },
          ],
          responses: {
            "200": {
              description: "Retention runs list",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RetentionRunListResponse" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            "403": {
              description: "Forbidden",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
          },
        },
      },
      "/health": {
        get: {
          summary: "Health check",
          responses: {
            "200": {
              description: "Service healthy",
            },
          },
        },
      },
    },
  };
}

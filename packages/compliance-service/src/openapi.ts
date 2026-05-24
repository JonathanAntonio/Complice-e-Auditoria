import {
  extendZodWithOpenApi,
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const ErrorSchema = z.object({ error: z.string(), message: z.string() }).openapi("Error");
const CreateViolationBodySchema = z.object({
  title: z.string().min(3).max(120),
  severity: z.enum(["baixa", "media", "alta", "critica"]).optional().default("media"),
}).openapi("CreateViolationBody");
const UpdateViolationBodySchema = z.object({
  title: z.string().min(3).max(120).optional(),
  severity: z.enum(["baixa", "media", "alta", "critica"]).optional(),
  status: z.enum(["aberta", "em_analise", "resolvida", "dispensada"]).optional(),
  dismissalJustification: z.string().min(5).max(500).optional(),
  dismissalApprovedBy: z.string().min(3).max(120).optional(),
}).openapi("UpdateViolationBody");
const ViolationResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(["baixa", "media", "alta", "critica"]),
  status: z.enum(["aberta", "em_analise", "resolvida", "dispensada"]),
  resolvedAt: z.string().nullable(),
  dismissedAt: z.string().nullable(),
  dismissalJustification: z.string().nullable(),
  dismissalApprovedBy: z.string().nullable(),
  retentionUntil: z.string().nullable(),
  createdAt: z.string(),
}).openapi("ViolationResponse");
const RetentionRunResponseSchema = z.object({
  id: z.string(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  status: z.enum(["running", "success", "failed"]),
  retentionDays: z.number().int(),
  cutoffAt: z.string(),
  scannedCount: z.number().int(),
  eligibleCount: z.number().int(),
  monitorOnlyCount: z.number().int(),
  errorMessage: z.string().nullable(),
}).openapi("RetentionRunResponse");
const RetentionRunListResponseSchema = z.object({
  items: z.array(RetentionRunResponseSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
}).openapi("RetentionRunListResponse");

const registry = new OpenAPIRegistry();

registry.registerPath({
  method: "get",
  path: "/api/violations",
  summary: "Listar violações",
  tags: ["Violations"],
  description: "Exige autenticação e a permissão compliance.violations.read.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Lista de violações",
      content: {
        "application/json": {
          schema: z.array(ViolationResponseSchema),
        },
      },
    },
    401: { description: "Não autenticado", content: { "application/json": { schema: ErrorSchema } } },
    403: { description: "Sem permissão", content: { "application/json": { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/retention/runs",
  summary: "Listar execuções de retenção (monitor-only)",
  tags: ["Retention"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().int().positive().optional(),
      pageSize: z.coerce.number().int().min(1).max(100).optional(),
      status: z.enum(["running", "success", "failed"]).optional(),
    }),
  },
  responses: {
    200: {
      description: "Lista paginada de runs de retenção",
      content: { "application/json": { schema: RetentionRunListResponseSchema } },
    },
    401: { description: "Não autenticado", content: { "application/json": { schema: ErrorSchema } } },
    403: { description: "Sem permissão", content: { "application/json": { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/violations",
  summary: "Criar violação",
  tags: ["Violations"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: CreateViolationBodySchema } },
    },
  },
  responses: {
    201: {
      description: "Violação criada",
      content: { "application/json": { schema: ViolationResponseSchema } },
    },
    400: { description: "Validação", content: { "application/json": { schema: ErrorSchema } } },
    401: { description: "Não autenticado", content: { "application/json": { schema: ErrorSchema } } },
    403: { description: "Sem permissão", content: { "application/json": { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/violations/{violationId}",
  summary: "Editar violação",
  tags: ["Violations"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      violationId: z.string().min(1),
    }),
    body: {
      content: { "application/json": { schema: UpdateViolationBodySchema } },
    },
  },
  responses: {
    200: {
      description: "Violação atualizada",
      content: { "application/json": { schema: ViolationResponseSchema } },
    },
    400: { description: "Validação", content: { "application/json": { schema: ErrorSchema } } },
    401: { description: "Não autenticado", content: { "application/json": { schema: ErrorSchema } } },
    403: { description: "Sem permissão", content: { "application/json": { schema: ErrorSchema } } },
    404: { description: "Violação não encontrada", content: { "application/json": { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/violations/test-permission",
  summary: "Validar permissão de teste de compliance",
  tags: ["Violations"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Permissão válida",
      content: {
        "application/json": {
          schema: z.object({
            ok: z.literal(true),
            permission: z.literal("compliance.test.access"),
          }),
        },
      },
    },
    401: { description: "Não autenticado", content: { "application/json": { schema: ErrorSchema } } },
    403: { description: "Sem permissão", content: { "application/json": { schema: ErrorSchema } } },
  },
});

export function createComplianceOpenApi(serverUrl: string): object {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const doc = generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "Compliance Service API",
      version: "1.0.0",
      description: "Listagem, criação, edição e validação de permissão de violações de compliance.",
    },
    servers: [{ url: serverUrl }],
  });

  const docObj = doc as { components?: { securitySchemes?: object } };
  if (docObj.components) {
    docObj.components.securitySchemes = {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token obtido no Identity Service via OAuth callback",
      },
    };
  }
  return doc;
}

import {
  extendZodWithOpenApi,
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { createUserSchema } from "./application/dtos/create-user.dto";
import { userResponseDtoSchema } from "./application/dtos/user-response.dto";
import {
  assignUserRoleSchema,
  assignUserRolesSchema,
} from "./application/dtos/assign-user-role.dto";
import { updateUserSecuritySchema } from "./application/dtos/update-user-security.dto";

extendZodWithOpenApi(z);

const ErrorSchema = z.object({ error: z.string(), message: z.string() }).openapi("Error");
const UserResponseSchema = userResponseDtoSchema.openapi("UserResponse");
const CreateUserBodySchema = createUserSchema.openapi("CreateUserBody");
const AssignUserRoleBodySchema = assignUserRoleSchema.openapi("AssignUserRoleBody");
const AssignUserRolesBodySchema = assignUserRolesSchema.openapi("AssignUserRolesBody");
const UpdateUserSecurityBodySchema = updateUserSecuritySchema.openapi("UpdateUserSecurityBody");
const OAuthCallbackQuerySchema = z.object({
  code: z.string(),
  state: z.string(),
});
const OAuthAuthorizationUrlQuerySchema = z.object({
  redirect_uri: z.string().url().optional(),
});

const registry = new OpenAPIRegistry();

registry.registerPath({
  method: "get",
  path: "/api/auth/me",
  summary: "Usuário atual (JWT)",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "OK",
      content: { "application/json": { schema: UserResponseSchema } },
    },
    401: {
      description: "Não autenticado",
      content: { "application/json": { schema: ErrorSchema } },
    },
    404: {
      description: "Usuário não encontrado",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/logout",
  summary: "Logout (auditoria)",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    204: { description: "Logout registrado" },
    401: {
      description: "Não autenticado",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/auth/google/url",
  summary: "Retorna URL de autorização Google OAuth",
  tags: ["Auth"],
  request: { query: OAuthAuthorizationUrlQuerySchema },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({ url: z.string().url() }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/auth/google/callback",
  summary: "Callback OAuth Google (query: code, state)",
  tags: ["Auth"],
  request: { query: OAuthCallbackQuerySchema },
  responses: {
    200: {
      description: "Autenticado via OAuth",
      content: {
        "application/json": {
          schema: z.object({
            user: UserResponseSchema,
            accessToken: z.string(),
            expiresIn: z.string(),
          }),
        },
      },
    },
    400: { description: "State inválido/expirado", content: { "application/json": { schema: ErrorSchema } } },
    401: { description: "Não autenticado", content: { "application/json": { schema: ErrorSchema } } },
    403: { description: "Usuário inativo", content: { "application/json": { schema: ErrorSchema } } },
    423: { description: "Usuário bloqueado", content: { "application/json": { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/auth/github/url",
  summary: "Retorna URL de autorização GitHub OAuth",
  tags: ["Auth"],
  request: { query: OAuthAuthorizationUrlQuerySchema },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({ url: z.string().url() }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/auth/github/callback",
  summary: "Callback OAuth GitHub (query: code, state)",
  tags: ["Auth"],
  request: { query: OAuthCallbackQuerySchema },
  responses: {
    200: {
      description: "Autenticado via OAuth",
      content: {
        "application/json": {
          schema: z.object({
            user: UserResponseSchema,
            accessToken: z.string(),
            expiresIn: z.string(),
          }),
        },
      },
    },
    400: { description: "State inválido/expirado", content: { "application/json": { schema: ErrorSchema } } },
    401: { description: "Não autenticado", content: { "application/json": { schema: ErrorSchema } } },
    403: { description: "Usuário inativo", content: { "application/json": { schema: ErrorSchema } } },
    423: { description: "Usuário bloqueado", content: { "application/json": { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/users",
  summary: "Listar usuários",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().int().positive().optional(),
      pageSize: z.coerce.number().int().positive().optional(),
      search: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            items: z.array(UserResponseSchema),
            page: z.number().int().positive(),
            pageSize: z.number().int().positive(),
            total: z.number().int().nonnegative(),
          }),
        },
      },
    },
    401: {
      description: "Não autenticado",
      content: { "application/json": { schema: ErrorSchema } },
    },
    403: {
      description: "Sem permissão",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/users",
  summary: "Criar usuário (administrador)",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: CreateUserBodySchema } },
    },
  },
  responses: {
    201: {
      description: "Criado",
      content: { "application/json": { schema: UserResponseSchema } },
    },
    400: { description: "Validação", content: { "application/json": { schema: ErrorSchema } } },
    401: {
      description: "Não autenticado",
      content: { "application/json": { schema: ErrorSchema } },
    },
    403: {
      description: "Sem permissão (administrador)",
      content: { "application/json": { schema: ErrorSchema } },
    },
    409: { description: "Email já existe", content: { "application/json": { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/users/{id}",
  summary: "Buscar usuário por ID",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "OK",
      content: { "application/json": { schema: UserResponseSchema } },
    },
    401: {
      description: "Não autenticado",
      content: { "application/json": { schema: ErrorSchema } },
    },
    404: {
      description: "Não encontrado",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/api/users/{id}/role",
  summary: "Alterar papel principal do usuário",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: AssignUserRoleBodySchema } },
    },
  },
  responses: {
    200: {
      description: "OK",
      content: { "application/json": { schema: UserResponseSchema } },
    },
    400: {
      description: "Validação",
      content: { "application/json": { schema: ErrorSchema } },
    },
    401: {
      description: "Não autenticado",
      content: { "application/json": { schema: ErrorSchema } },
    },
    403: {
      description: "Sem permissão",
      content: { "application/json": { schema: ErrorSchema } },
    },
    404: {
      description: "Usuário não encontrado",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/users/{id}/security",
  summary: "Atualizar status de segurança do usuário",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: UpdateUserSecurityBodySchema } },
    },
  },
  responses: {
    200: {
      description: "OK",
      content: { "application/json": { schema: UserResponseSchema } },
    },
    400: {
      description: "Validação",
      content: { "application/json": { schema: ErrorSchema } },
    },
    401: {
      description: "Não autenticado",
      content: { "application/json": { schema: ErrorSchema } },
    },
    403: {
      description: "Sem permissão",
      content: { "application/json": { schema: ErrorSchema } },
    },
    404: {
      description: "Usuário não encontrado",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/users/{id}",
  summary: "Desativar usuário",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "OK",
      content: { "application/json": { schema: UserResponseSchema } },
    },
    401: {
      description: "Não autenticado",
      content: { "application/json": { schema: ErrorSchema } },
    },
    403: {
      description: "Sem permissão",
      content: { "application/json": { schema: ErrorSchema } },
    },
    404: {
      description: "Usuário não encontrado",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/api/users/{id}/roles",
  summary: "Sincronizar papéis do usuário",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: AssignUserRolesBodySchema } },
    },
  },
  responses: {
    200: {
      description: "OK",
      content: { "application/json": { schema: UserResponseSchema } },
    },
    400: {
      description: "Validação",
      content: { "application/json": { schema: ErrorSchema } },
    },
    401: {
      description: "Não autenticado",
      content: { "application/json": { schema: ErrorSchema } },
    },
    403: {
      description: "Sem permissão",
      content: { "application/json": { schema: ErrorSchema } },
    },
    404: {
      description: "Usuário não encontrado",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

/**
 * Gera a spec OpenAPI 3 a partir dos schemas Zod (fonte única de verdade).
 * serverUrl: base do serviço (ex.: http://localhost:3001 ou http://localhost/identity quando atrás do nginx).
 */
export function createIdentityOpenApi(serverUrl: string): object {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const doc = generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "Identity Service API",
      version: "1.0.0",
      description: "Autenticação, registro e gestão de usuários.",
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
        description: "Token obtido nos callbacks OAuth (/api/auth/google/callback ou /api/auth/github/callback)",
      },
    };
  }
  return doc;
}

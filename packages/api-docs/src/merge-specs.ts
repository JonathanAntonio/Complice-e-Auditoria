/**
 * Mescla specs OpenAPI 3 em uma única, prefixando schemas para evitar colisões.
 * Mantém múltiplos servers (Identity, Compliance, Integration, Audit, Risk, Reporting, Notification)
 * para o "Try it out" do Swagger.
 */

export interface OpenApiSpec {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: Array<{ url: string; description?: string }>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
  paths?: Record<string, unknown>;
}

const REF_PREFIX = "#/components/schemas/";

function prefixRefsInValue(value: unknown, prefix: string, schemaKeys: string[]): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    for (const key of schemaKeys) {
      if (value === REF_PREFIX + key) return REF_PREFIX + prefix + key;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => prefixRefsInValue(item, prefix, schemaKeys));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = k === "$ref" && typeof v === "string" && v.startsWith(REF_PREFIX)
        ? schemaKeys.reduce((s, key) => s.replace(REF_PREFIX + key, REF_PREFIX + prefix + key), v)
        : prefixRefsInValue(v, prefix, schemaKeys);
    }
    return out;
  }
  return value;
}

function prefixSpec(spec: OpenApiSpec, prefix: string): OpenApiSpec {
  const schemas = spec.components?.schemas ?? {};
  const schemaKeys = Object.keys(schemas);
  if (schemaKeys.length === 0) return spec;

  const prefixedSchemas: Record<string, unknown> = {};
  for (const key of schemaKeys) {
    const value = prefixRefsInValue(schemas[key], prefix, schemaKeys);
    prefixedSchemas[prefix + key] = value;
  }

  const pathValues = spec.paths ? prefixRefsInValue(spec.paths, prefix, schemaKeys) : undefined;
  return {
    ...spec,
    components: {
      ...spec.components,
      schemas: prefixedSchemas,
    },
    paths: pathValues as Record<string, unknown> | undefined,
  };
}

export function mergeOpenApiSpecs(specs: Array<{ spec: OpenApiSpec; prefix: string; serviceName: string }>): OpenApiSpec {
  const normalized = specs.map(({ spec, prefix, serviceName }) => ({
    spec: prefixSpec(spec, prefix),
    serviceName,
  }));

  const mergedServers = normalized.flatMap(({ spec, serviceName }) =>
    (spec.servers ?? []).map((s) => ({ ...s, description: s.description ?? serviceName }))
  );

  const securitySchemes = normalized.reduce<Record<string, unknown>>((acc, { spec }) => {
    return {
      ...acc,
      ...(spec.components?.securitySchemes ?? {}),
    };
  }, {});

  const schemas = normalized.reduce<Record<string, unknown>>((acc, { spec }) => {
    return {
      ...acc,
      ...(spec.components?.schemas ?? {}),
    };
  }, {});

  const paths = normalized.reduce<Record<string, unknown>>((acc, { spec }) => {
    return {
      ...acc,
      ...(spec.paths ?? {}),
    };
  }, {});

  return {
    openapi: "3.0.3",
    info: {
      title: "LFramework API",
      version: "1.0.0",
      description: "Documentação unificada: Identity, Compliance, Integration, Audit, Risk Analysis, Reporting e Notification. Use o menu «Servers» para alternar o backend nas requisições.",
    },
    servers: mergedServers,
    components: {
      securitySchemes,
      schemas,
    },
    paths,
  };
}

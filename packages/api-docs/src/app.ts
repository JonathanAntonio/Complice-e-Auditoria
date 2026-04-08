import express from "express";
import swaggerUi from "swagger-ui-express";
import { mergeOpenApiSpecs, type OpenApiSpec } from "./merge-specs";

export interface CreateApiDocsAppOptions {
  identitySpecUrl?: string;
  complianceSpecUrl?: string;
  integrationSpecUrl?: string;
  auditSpecUrl?: string;
  fetchFn?: typeof fetch;
  fetchTimeoutMs?: number;
}

export function createApp(options: CreateApiDocsAppOptions = {}) {
  const identitySpecUrl = options.identitySpecUrl ?? process.env.IDENTITY_SPEC_URL ?? "http://localhost:3001/api-docs.json";
  const complianceSpecUrl = options.complianceSpecUrl ?? process.env.COMPLIANCE_SPEC_URL ?? "http://localhost:3002/api-docs.json";
  const integrationSpecUrl = options.integrationSpecUrl ?? process.env.INTEGRATION_SPEC_URL ?? "http://localhost:3003/api-docs.json";
  const auditSpecUrl = options.auditSpecUrl ?? process.env.AUDIT_SPEC_URL ?? "http://localhost:3005/api-docs.json";
  const fetchFn = options.fetchFn ?? fetch;
  const fetchTimeoutMs = options.fetchTimeoutMs ?? 5000;

  async function fetchSpec(url: string): Promise<OpenApiSpec> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let res: Response;
    try {
      if (typeof AbortSignal.timeout === "function") {
        res = await fetchFn(url, { signal: AbortSignal.timeout(fetchTimeoutMs) });
      } else {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), fetchTimeoutMs);
        res = await fetchFn(url, { signal: controller.signal });
      }
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
        throw new Error(`fetchSpec timed out fetching ${url}`, { cause: err });
      }
      throw err;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return (await res.json()) as OpenApiSpec;
  }

  async function getMergedSpec(): Promise<object> {
    const [identitySpec, complianceSpec, integrationSpec, auditSpec] = await Promise.all([
      fetchSpec(identitySpecUrl),
      fetchSpec(complianceSpecUrl),
      fetchSpec(integrationSpecUrl),
      fetchSpec(auditSpecUrl),
    ]);
    return mergeOpenApiSpecs([
      { spec: identitySpec, prefix: "Identity_", serviceName: "Identity Service" },
      { spec: complianceSpec, prefix: "Compliance_", serviceName: "Compliance Service" },
      { spec: integrationSpec, prefix: "Integration_", serviceName: "Integration Service" },
      { spec: auditSpec, prefix: "Audit_", serviceName: "Audit Service" },
    ]);
  }

  const app = express();

  app.use((_req, res, next) => {
    res.setHeader("X-Served-By", "api-docs");
    next();
  });

  app.get("/openapi.json", async (_req, res) => {
    try {
      const spec = await getMergedSpec();
      res.json(spec);
    } catch (err) {
      res.status(502).json({
        error: "Failed to merge specs",
        message: err instanceof Error ? err.message : String(err),
        hint: "Ensure identity, compliance, integration and audit services are running and *_SPEC_URL vars are correct.",
      });
    }
  });

  app.use("/", swaggerUi.serve, swaggerUi.setup(null as unknown as object, {
    swaggerOptions: { url: "openapi.json" },
    customSiteTitle: "LFramework API",
  }));

  return app;
}

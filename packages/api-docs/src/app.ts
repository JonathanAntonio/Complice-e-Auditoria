import express from "express";
import swaggerUi from "swagger-ui-express";
import { mergeOpenApiSpecs, type OpenApiSpec } from "./merge-specs";

export interface CreateApiDocsAppOptions {
  identitySpecUrl?: string;
  catalogSpecUrl?: string;
  fetchFn?: typeof fetch;
  fetchTimeoutMs?: number;
}

export function createApp(options: CreateApiDocsAppOptions = {}) {
  const identitySpecUrl = options.identitySpecUrl ?? process.env.IDENTITY_SPEC_URL ?? "http://localhost:3001/api-docs.json";
  const catalogSpecUrl = options.catalogSpecUrl ?? process.env.CATALOG_SPEC_URL ?? "http://localhost:3002/api-docs.json";
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
        throw new Error(`fetchSpec timed out fetching ${url}`);
      }
      throw err;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return (await res.json()) as OpenApiSpec;
  }

  async function getMergedSpec(): Promise<object> {
    const [identitySpec, catalogSpec] = await Promise.all([
      fetchSpec(identitySpecUrl),
      fetchSpec(catalogSpecUrl),
    ]);
    return mergeOpenApiSpecs(identitySpec, catalogSpec);
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
        hint: "Ensure identity and catalog services are running and IDENTITY_SPEC_URL / CATALOG_SPEC_URL are correct.",
      });
    }
  });

  app.use("/", swaggerUi.serve, swaggerUi.setup(null as unknown as object, {
    swaggerOptions: { url: "openapi.json" },
    customSiteTitle: "LFramework API",
  }));

  return app;
}

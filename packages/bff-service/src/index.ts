import path from "path";
import { config as loadEnv } from "dotenv";
import {
  logger as baseLogger,
  setLogger,
  wrapWithAudit,
  HttpAuditPublisher,
  logger
} from "@lframework/shared";
import { loadBffConfig } from "./app/config";
import { createApp } from "./app/create-app";

loadEnv({ path: path.resolve(process.cwd(), "../../.env"), override: false });

const config = loadBffConfig(process.env);

// Inicializa auditoria centralizada via HTTP (para serviços sem RabbitMQ)
const auditServiceUrl = process.env.AUDIT_BASE_URL || "http://localhost:4005";
const publisher = new HttpAuditPublisher(auditServiceUrl);
const auditLogger = wrapWithAudit(baseLogger, publisher, "bff-service");
setLogger(auditLogger);

const app = createApp(config);

app.listen(config.port, () => {
  logger.info(
    {
      port: config.port,
      gatewayBaseUrl: config.gatewayBaseUrl,
      iamAuthBasePath: config.iamAuthBasePath,
      complianceBasePath: config.complianceBasePath,
      auditBasePath: config.auditBasePath,
      publicBaseUrl: config.explicitPublicBaseUrl,
      sessionCookieName: config.sessionCookieName,
      sessionMaxAgeSeconds: config.sessionMaxAgeSeconds,
    },
    "BFF service listening"
  );
});

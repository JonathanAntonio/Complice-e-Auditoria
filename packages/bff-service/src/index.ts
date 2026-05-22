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
const auditFailClosed = process.env.AUDIT_FAIL_CLOSED === "true";

// Inicializa auditoria centralizada via HTTP (para serviços sem RabbitMQ)
const auditServiceUrl = process.env.AUDIT_BASE_URL || "http://localhost:4005";
const publisher = new HttpAuditPublisher(auditServiceUrl, {
  failClosed: auditFailClosed,
  onUnavailable: (error) => {
    baseLogger.fatal({ err: error }, "Audit service unavailable (fail-closed enabled). Stopping BFF.");
    process.exit(1);
  },
});
const auditLogger = wrapWithAudit(baseLogger, publisher, "bff-service");
setLogger(auditLogger);

async function bootstrap(): Promise<void> {
  if (auditFailClosed) {
    await publisher.assertAvailable();
  }

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
        auditFailClosed,
      },
      "BFF service listening"
    );
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, "Failed to start bff-service");
  process.exit(1);
});

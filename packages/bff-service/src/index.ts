import path from "path";
import { config as loadEnv } from "dotenv";
import { logger } from "@lframework/shared";
import { loadBffConfig } from "./app/config";
import { createApp } from "./app/create-app";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

const config = loadBffConfig(process.env);
const app = createApp(config);

app.listen(config.port, () => {
  logger.info(
    {
      port: config.port,
      gatewayBaseUrl: config.gatewayBaseUrl,
      iamAuthBasePath: config.iamAuthBasePath,
      publicBaseUrl: config.explicitPublicBaseUrl,
      sessionCookieName: config.sessionCookieName,
      sessionMaxAgeSeconds: config.sessionMaxAgeSeconds,
    },
    "BFF service listening"
  );
});

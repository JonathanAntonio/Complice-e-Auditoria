import path from "path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import type { Server } from "http";
import { logger, type ServiceMetrics } from "@lframework/shared";
import { createContainer } from "./container";
import { createApp } from "./app";
import { loadAuditServiceConfig } from "./app/config";

const config = loadAuditServiceConfig(process.env);

function closeServer(server: Server, timeoutMs: number = 10_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`HTTP server close timed out after ${timeoutMs}ms`)), timeoutMs);
    server.close((err) => {
      clearTimeout(timeout);
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

async function bootstrap() {
  const container = createContainer(config);
  await container.startConsumer();

  let metricsRef: ServiceMetrics | null = null;
  const app = createApp(container, {
    baseUrl: config.baseUrl,
    corsOrigin: config.corsOrigin,
    onMetricsReady: (metrics) => {
      metricsRef = metrics;
    },
  });

  let retentionSweepRunning = false;
  const runRetentionSweep = async () => {
    if (retentionSweepRunning) {
      return;
    }
    retentionSweepRunning = true;
    try {
      const result = await container.runRetentionSweep(
        config.retentionMinDays,
        config.retentionBatchSize,
        config.retentionScopeSourceServices
      );
      metricsRef?.recordGauge("audit_retention_last_run_timestamp_seconds", Math.floor(Date.now() / 1000));
      metricsRef?.recordGauge("audit_retention_last_run_scanned_total", result.scannedCount);
      metricsRef?.recordGauge("audit_retention_last_run_eligible_total", result.eligibleCount);
      metricsRef?.recordGauge("audit_retention_last_run_monitor_only_total", result.monitorOnlyCount);
      metricsRef?.recordGauge("audit_retention_last_run_success", 1);
    } catch (err) {
      logger.error({ err }, "Audit retention sweep failed");
      metricsRef?.recordGauge("audit_retention_last_run_timestamp_seconds", Math.floor(Date.now() / 1000));
      metricsRef?.recordGauge("audit_retention_last_run_success", 0);
    } finally {
      retentionSweepRunning = false;
    }
  };
  void runRetentionSweep();
  const retentionSweepTimer = setInterval(() => {
    void runRetentionSweep();
  }, config.retentionSweepIntervalMs);

  const server = app.listen(config.port, () => {
    logger.info(`Audit service listening on http://localhost:${config.port}`);
  });

  let shuttingDown = false;
  const shutdown = async (signal: "SIGTERM" | "SIGINT") => {
    if (shuttingDown) return;
    shuttingDown = true;
    clearInterval(retentionSweepTimer);

    try {
      await closeServer(server);
      logger.info({ signal }, "Audit HTTP server closed");
    } catch (err) {
      logger.error({ err, signal }, "Failed to close audit HTTP server");
    }

    try {
      await container.disconnect();
      logger.info({ signal }, "Audit container disconnected");
      process.exit(0);
    } catch (err) {
      logger.error({ err, signal }, "Audit disconnect failed");
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, "Failed to start audit-service");
  process.exit(1);
});

import path from "path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), "../../.env"), override: true });

import { createContainer } from "./container";
import { createApp } from "./app";
import { logger, type ServiceMetrics } from "@lframework/shared";
import { loadComplianceServiceConfig } from "./app/config";

const config = loadComplianceServiceConfig(process.env);

async function bootstrap() {
  const container = createContainer({
    databaseUrl: config.databaseUrl,
    redisUrl: config.redisUrl,
    rabbitmqUrl: config.rabbitmqUrl,
    jwtSecret: config.jwtSecret,
  });

  await container.connectRabbitMQ((payload) =>
    container.handleUserCreatedUseCase.execute(payload)
  );

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
        config.retentionScopeStatuses
      );
      metricsRef?.recordGauge("compliance_retention_last_run_timestamp_seconds", Math.floor(Date.now() / 1000));
      metricsRef?.recordGauge("compliance_retention_last_run_scanned_total", result.scannedCount);
      metricsRef?.recordGauge("compliance_retention_last_run_eligible_total", result.eligibleCount);
      metricsRef?.recordGauge("compliance_retention_last_run_monitor_only_total", result.monitorOnlyCount);
      metricsRef?.recordGauge("compliance_retention_last_run_success", 1);
    } catch (err) {
      logger.error({ err }, "Compliance retention sweep failed");
      metricsRef?.recordGauge("compliance_retention_last_run_timestamp_seconds", Math.floor(Date.now() / 1000));
      metricsRef?.recordGauge("compliance_retention_last_run_success", 0);
    } finally {
      retentionSweepRunning = false;
    }
  };
  void runRetentionSweep();
  const retentionSweepTimer = setInterval(() => {
    void runRetentionSweep();
  }, config.retentionSweepIntervalMs);

  app.listen(config.port, () => {
    logger.info(`Compliance service listening on http://localhost:${config.port}`);
  });

  process.on("SIGTERM", async () => {
    try {
      clearInterval(retentionSweepTimer);
      await container.disconnect();
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Disconnect failed on SIGTERM");
      process.exit(1);
    }
  });

  process.on("SIGINT", async () => {
    try {
      clearInterval(retentionSweepTimer);
      await container.disconnect();
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Disconnect failed on SIGINT");
      process.exit(1);
    }
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, "Failed to start compliance-service");
  process.exit(1);
});

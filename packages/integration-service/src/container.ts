import { createContainer as createAwilixContainer, asFunction, asValue } from "awilix";
import { logger } from "@lframework/shared";
import { PrismaClient } from "../generated/prisma-client";
import { createIntegrationRoutes } from "./adapters/driving/http/routes";
import { PrismaEventRepository } from "./adapters/driven/persistence/prisma-event.repository";
import { RabbitMqEventPublisherAdapter } from "./adapters/driven/messaging/rabbitmq-event-publisher.adapter";
import { OutboxRelayAdapter } from "./adapters/driven/messaging/outbox-relay.adapter";
import { IntegrationMetrics } from "./application/metrics";
import { PrometheusMetricsReaderAdapter } from "./adapters/driven/observability/prometheus-metrics-reader.adapter";
import { GetMetricsUseCase } from "./application/use-cases/get-metrics.use-case";
import { MetricsController } from "./adapters/driving/http/metrics.controller";
import type { IMetricsReader } from "./application/ports/metrics-reader.port";

export interface IntegrationContainerConfig {
  databaseUrl: string;
  rabbitmqUrl: string;
  integrationApiKey: string;
}

interface IntegrationCradle {
  config: IntegrationContainerConfig;
  prisma: PrismaClient;
  metrics: IntegrationMetrics;
  metricsReader: IMetricsReader;
  getMetricsUseCase: GetMetricsUseCase;
  metricsController: MetricsController;
  repository: PrismaEventRepository;
  eventPublisher: RabbitMqEventPublisherAdapter;
  outboxRelay: OutboxRelayAdapter;
  integrationRoutes: ReturnType<typeof createIntegrationRoutes>;
}

export function createContainer(config: IntegrationContainerConfig) {
  const awilix = createAwilixContainer<IntegrationCradle>();

  awilix.register({
    config: asValue(config),
    prisma: asFunction(({ config }: { config: IntegrationContainerConfig }) => {
      return new PrismaClient({ datasources: { db: { url: config.databaseUrl } } });
    }).singleton(),
    metrics: asFunction(() => new IntegrationMetrics()).singleton(),
    metricsReader: asFunction((cradle: IntegrationCradle) => new PrometheusMetricsReaderAdapter(cradle.metrics)).singleton(),
    getMetricsUseCase: asFunction((cradle: IntegrationCradle) => new GetMetricsUseCase(cradle.metricsReader)).singleton(),
    metricsController: asFunction((cradle: IntegrationCradle) => new MetricsController(cradle.getMetricsUseCase)).singleton(),
    repository: asFunction((cradle: IntegrationCradle) => new PrismaEventRepository(cradle.prisma)).singleton(),
    eventPublisher: asFunction(({ config }: { config: IntegrationContainerConfig }) => new RabbitMqEventPublisherAdapter(config.rabbitmqUrl)).singleton(),
    outboxRelay: asFunction(
      (cradle: IntegrationCradle) =>
        new OutboxRelayAdapter(cradle.prisma, cradle.eventPublisher, cradle.metrics)
    ).singleton(),
    integrationRoutes: asFunction(
      (cradle: IntegrationCradle) =>
        createIntegrationRoutes(cradle.repository, cradle.metrics, cradle.config.integrationApiKey)
    ).singleton(),
  });

  const c = awilix.cradle;

  return {
    get prisma() {
      return c.prisma;
    },
    get integrationRoutes() {
      return c.integrationRoutes;
    },
    get metricsController() {
      return c.metricsController;
    },
    async connectRabbitMQ(): Promise<void> {
      await c.eventPublisher.connect();
    },
    startOutboxRelay(intervalMs: number = 2_000): void {
      c.outboxRelay.start(intervalMs);
    },
    async disconnect(): Promise<void> {
      try {
        c.outboxRelay.stop();
      } catch (err) {
        logger.warn({ err }, "Failed to stop outbox relay during shutdown");
      }

      const results = await Promise.allSettled([
        c.eventPublisher.disconnect(),
        c.prisma.$disconnect(),
      ]);
      const [publisherResult, prismaResult] = results;

      if (publisherResult.status === "rejected") {
        logger.error({ err: publisherResult.reason }, "Failed to disconnect RabbitMQ publisher");
      }
      if (prismaResult.status === "rejected") {
        logger.error({ err: prismaResult.reason }, "Failed to disconnect Prisma client");
      }

      if (publisherResult.status === "rejected" || prismaResult.status === "rejected") {
        throw new Error("Integration container disconnect completed with cleanup errors");
      }
    },
  };
}

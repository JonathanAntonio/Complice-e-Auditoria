import { asFunction, asValue, createContainer as createAwilixContainer } from "awilix";
import {
  createAuthMiddleware,
  JwtTokenVerifier,
  requireAnyPermission,
} from "@lframework/shared";
import { PrismaClient } from "../../integration-service/generated/prisma-client";
import type { AuditServiceConfig } from "./app/config";
import { PrismaAuditLogRepository } from "./adapters/driven/persistence/prisma-audit-log.repository";
import { ListAuditLogsUseCase } from "./application/use-cases/list-audit-logs.use-case";
import { ListRetentionRunsUseCase } from "./application/use-cases/list-retention-runs.use-case";
import { IngestAuditEventUseCase } from "./application/use-cases/ingest-audit-event.use-case";
import { RunAuditRetentionSweepUseCase } from "./application/use-cases/run-retention-sweep.use-case";
import { AuditLogsController } from "./adapters/driving/http/audit-logs.controller";
import { createAuditRoutes } from "./adapters/driving/http/routes";
import { mapAuditErrorToHttp } from "./adapters/driving/http/error-to-http.mapper";
import { RabbitMqAuditEventsAdapter } from "./adapters/driven/messaging/rabbitmq-audit-events.adapter";

interface AuditCradle {
  config: AuditServiceConfig;
  prisma: PrismaClient;
  tokenVerifier: JwtTokenVerifier;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
  requireAuditLogsRead: ReturnType<typeof requireAnyPermission>;
  repository: PrismaAuditLogRepository;
  listAuditLogsUseCase: ListAuditLogsUseCase;
  listRetentionRunsUseCase: ListRetentionRunsUseCase;
  ingestAuditEventUseCase: IngestAuditEventUseCase;
  runAuditRetentionSweepUseCase: RunAuditRetentionSweepUseCase;
  auditLogsController: AuditLogsController;
  auditRoutes: ReturnType<typeof createAuditRoutes>;
  auditEventsAdapter: RabbitMqAuditEventsAdapter;
}

export function createContainer(config: AuditServiceConfig) {
  const awilix = createAwilixContainer<AuditCradle>();

  awilix.register({
    config: asValue(config),
    prisma: asFunction(({ config }: { config: AuditServiceConfig }) =>
      new PrismaClient({
        datasources: { db: { url: config.databaseUrl } },
      })
    ).singleton(),
    tokenVerifier: asFunction(({ config }: { config: AuditServiceConfig }) => new JwtTokenVerifier(config.jwtSecret)).singleton(),
    authMiddleware: asFunction(({ tokenVerifier }: { tokenVerifier: JwtTokenVerifier }) =>
      createAuthMiddleware((token) => tokenVerifier.verify(token))
    ).singleton(),
    requireAuditLogsRead: asFunction(() =>
      requireAnyPermission(["audit.logs.read.any", "audit.logs.read.scoped"])
    ).singleton(),
    repository: asFunction((cradle: AuditCradle) => new PrismaAuditLogRepository(cradle.prisma)).singleton(),
    listAuditLogsUseCase: asFunction((cradle: AuditCradle) => new ListAuditLogsUseCase(cradle.repository)).singleton(),
    listRetentionRunsUseCase: asFunction((cradle: AuditCradle) => new ListRetentionRunsUseCase(cradle.repository)).singleton(),
    ingestAuditEventUseCase: asFunction((cradle: AuditCradle) => new IngestAuditEventUseCase(cradle.repository)).singleton(),
    runAuditRetentionSweepUseCase: asFunction((cradle: AuditCradle) => new RunAuditRetentionSweepUseCase(cradle.prisma)).singleton(),
    auditLogsController: asFunction((cradle: AuditCradle) => new AuditLogsController(
      cradle.listAuditLogsUseCase,
      cradle.listRetentionRunsUseCase
    )).singleton(),
    auditRoutes: asFunction((cradle: AuditCradle) =>
      createAuditRoutes(cradle.auditLogsController, cradle.authMiddleware, cradle.requireAuditLogsRead)
    ).singleton(),
    auditEventsAdapter: asFunction(({ config }: { config: AuditServiceConfig }) =>
      new RabbitMqAuditEventsAdapter(config.rabbitmqUrl)
    ).singleton(),
  });

  const c = awilix.cradle;

  return {
    get auditRoutes() {
      return c.auditRoutes;
    },
    mapAuditErrorToHttp,
    async startConsumer(): Promise<void> {
      await c.auditEventsAdapter.start(c.ingestAuditEventUseCase);
    },
    async disconnect(): Promise<void> {
      await c.auditEventsAdapter.close();
      await c.prisma.$disconnect();
    },
    async runRetentionSweep(
      retentionDays: number,
      batchSize: number,
      scopedSourceServices: string[]
    ) {
      return c.runAuditRetentionSweepUseCase.execute({ retentionDays, batchSize, scopedSourceServices });
    },
  };
}

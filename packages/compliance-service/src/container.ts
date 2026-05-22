import { createContainer as createAwilixContainer, asValue, asFunction } from "awilix";
import { PrismaClient } from "../../identity-service/generated/prisma-client";
import Redis from "ioredis";
import type { UserCreatedPayload } from "@lframework/shared";
import type { ICacheService } from "@lframework/shared";
import {
  RedisCacheAdapter,
  createAuthMiddleware,
  JwtTokenVerifier,
  requirePermission,
  logger as baseLogger,
  setLogger,
  wrapWithAudit,
  RabbitMqAuditPublisher,
  RedisAuthzVersionChecker,
  type IAuthzVersionChecker,
} from "@lframework/shared";
import { PrismaItemRepository } from "./adapters/driven/persistence/prisma-item.repository";
import { PrismaReplicatedUserStore } from "./adapters/driven/persistence/prisma-replicated-user.store";
import { ItemsListCacheInvalidatorAdapter } from "./adapters/driven/cache/items-list-cache-invalidator.adapter";
import { RabbitMqUserEventsAdapter } from "./adapters/driving/messaging/rabbitmq-user-events.adapter";
import { CreateItemUseCase } from "./application/use-cases";
import { ListItemsUseCase } from "./application/use-cases";
import { UpdateItemUseCase } from "./application/use-cases";
import { HandleUserCreatedUseCase } from "./application/use-cases";
import { EvaluateComplianceUseCase } from "./application/use-cases";
import { RunRetentionSweepUseCase } from "./application/use-cases";
import { ListRetentionRunsUseCase } from "./application/use-cases";
import { ItemController } from "./adapters/driving/http/item.controller";
import { RetentionRunsController } from "./adapters/driving/http/retention-runs.controller";
import { createItemRoutes } from "./adapters/driving/http/routes";
import { mapApplicationErrorToHttp } from "./adapters/driving/http/error-to-http.mapper";

/** No-op event consumer for tests; when set, RabbitMQ is not used. */
export interface TestEventConsumer {
  start(): Promise<void>;
  close(): Promise<void>;
}

export interface ComplianceContainerConfig {
  databaseUrl: string;
  redisUrl: string;
  rabbitmqUrl: string;
  jwtSecret: string;
  /** When set, used instead of Redis cache (e.g. no-op in integration tests). */
  cacheOverride?: ICacheService;
  /** When set, used instead of starting RabbitMQ consumer (e.g. no-op in integration tests). */
  eventConsumerOverride?: TestEventConsumer;
}

/** Tipo do cradle (dependências resolvidas) para type-safety. */
interface ComplianceCradle {
  config: ComplianceContainerConfig;
  prisma: PrismaClient;
  redis: Redis;
  cache: ICacheService;
  itemRepository: PrismaItemRepository;
  replicatedUserStore: PrismaReplicatedUserStore;
  itemsListCacheInvalidator: ItemsListCacheInvalidatorAdapter;
  createItemUseCase: CreateItemUseCase;
  listItemsUseCase: ListItemsUseCase;
  updateItemUseCase: UpdateItemUseCase;
  handleUserCreatedUseCase: HandleUserCreatedUseCase;
  evaluateComplianceUseCase: EvaluateComplianceUseCase;
  runRetentionSweepUseCase: RunRetentionSweepUseCase;
  listRetentionRunsUseCase: ListRetentionRunsUseCase;
  itemController: ItemController;
  retentionRunsController: RetentionRunsController;
  tokenVerifier: JwtTokenVerifier;
  authzVersionChecker: IAuthzVersionChecker;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
  requireItemsRead: ReturnType<typeof requirePermission>;
  requireItemsCreate: ReturnType<typeof requirePermission>;
  requireComplianceTestAccess: ReturnType<typeof requirePermission>;
  itemRoutes: ReturnType<typeof createItemRoutes>;
  eventConsumer: RabbitMqUserEventsAdapter;
}

/**
 * Container de DI com Awilix.
 * Dependências registradas por nome; resolução automática por parâmetros do construtor.
 */
export function createContainer(config: ComplianceContainerConfig) {
  const awilix = createAwilixContainer<ComplianceCradle>();

  awilix.register({
    config: asValue(config),

    prisma: asFunction(({ config }: { config: ComplianceContainerConfig }) => {
      return new PrismaClient({
        datasources: { db: { url: config.databaseUrl } },
      });
    }).singleton(),

    redis: asFunction(({ config }: { config: ComplianceContainerConfig }) => {
      return new Redis(config.redisUrl, {
        connectTimeout: 5000,
        commandTimeout: 5000,
      });
    }).singleton(),

    cache: asFunction(
      ({ config, redis }: { config: ComplianceContainerConfig; redis: Redis }) =>
        config.cacheOverride ?? new RedisCacheAdapter(redis)
    ).singleton(),
    itemRepository: asFunction(
      (cradle: ComplianceCradle) => new PrismaItemRepository(cradle.prisma)
    ).singleton(),
    replicatedUserStore: asFunction(
      (cradle: ComplianceCradle) => new PrismaReplicatedUserStore(cradle.prisma)
    ).singleton(),
    itemsListCacheInvalidator: asFunction(
      (cradle: ComplianceCradle) =>
        new ItemsListCacheInvalidatorAdapter(cradle.cache)
    ).singleton(),

    createItemUseCase: asFunction(
      (cradle: ComplianceCradle) =>
        new CreateItemUseCase(cradle.itemRepository, cradle.itemsListCacheInvalidator)
    ).singleton(),
    listItemsUseCase: asFunction(
      (cradle: ComplianceCradle) =>
        new ListItemsUseCase(cradle.itemRepository, cradle.cache)
    ).singleton(),
    updateItemUseCase: asFunction(
      (cradle: ComplianceCradle) =>
        new UpdateItemUseCase(cradle.itemRepository, cradle.itemsListCacheInvalidator)
    ).singleton(),
    handleUserCreatedUseCase: asFunction(
      (cradle: ComplianceCradle) =>
        new HandleUserCreatedUseCase(cradle.replicatedUserStore, cradle.cache)
    ).singleton(),
    evaluateComplianceUseCase: asFunction(
      (cradle: ComplianceCradle) =>
        new EvaluateComplianceUseCase(cradle.itemRepository)
    ).singleton(),
    runRetentionSweepUseCase: asFunction(
      (cradle: ComplianceCradle) => new RunRetentionSweepUseCase(cradle.prisma)
    ).singleton(),
    listRetentionRunsUseCase: asFunction(
      (cradle: ComplianceCradle) => new ListRetentionRunsUseCase(cradle.prisma)
    ).singleton(),

    itemController: asFunction(
      (cradle: ComplianceCradle) =>
        new ItemController(cradle.createItemUseCase, cradle.listItemsUseCase, cradle.updateItemUseCase)
    ).singleton(),
    retentionRunsController: asFunction(
      (cradle: ComplianceCradle) =>
        new RetentionRunsController(cradle.listRetentionRunsUseCase)
    ).singleton(),

    tokenVerifier: asFunction(({ config }: { config: ComplianceContainerConfig }) => {
      return new JwtTokenVerifier(config.jwtSecret);
    }).singleton(),

    authzVersionChecker: asFunction(({ redis }: { redis: Redis }) => new RedisAuthzVersionChecker(redis)).singleton(),

    authMiddleware: asFunction(
      ({ tokenVerifier, authzVersionChecker }: { tokenVerifier: JwtTokenVerifier; authzVersionChecker: IAuthzVersionChecker }) =>
        createAuthMiddleware(
          (token) => tokenVerifier.verify(token),
          authzVersionChecker
        )
    ).singleton(),

    requireItemsRead: asFunction(() => requirePermission("compliance.violations.read")).singleton(),

    requireItemsCreate: asFunction(() => requirePermission("compliance.violations.create")).singleton(),

    requireComplianceTestAccess: asFunction(() => requirePermission("compliance.test.access")).singleton(),

    itemRoutes: asFunction(
      ({
        itemController,
        retentionRunsController,
        authMiddleware,
        requireItemsRead,
        requireItemsCreate,
        requireComplianceTestAccess,
      }: {
        itemController: ItemController;
        retentionRunsController: RetentionRunsController;
        authMiddleware: ReturnType<typeof createAuthMiddleware>;
        requireItemsRead: ReturnType<typeof requirePermission>;
        requireItemsCreate: ReturnType<typeof requirePermission>;
        requireComplianceTestAccess: ReturnType<typeof requirePermission>;
      }) => createItemRoutes(
        itemController,
        retentionRunsController,
        authMiddleware,
        requireItemsRead,
        requireItemsCreate,
        requireComplianceTestAccess
      )
    ).singleton(),

    eventConsumer: asFunction(
      ({ config }: { config: ComplianceContainerConfig }) =>
        new RabbitMqUserEventsAdapter(config.rabbitmqUrl)
    ).singleton(),
  });

  const c = awilix.cradle;
  let activeConsumer: { close(): Promise<void> } | null = null;

  return {
    get prisma() {
      return c.prisma;
    },
    get redis() {
      return c.redis;
    },
    get itemRoutes() {
      return c.itemRoutes;
    },
    mapApplicationErrorToHttp,
    get handleUserCreatedUseCase() {
      return c.handleUserCreatedUseCase;
    },
    async connectRabbitMQ(userCreatedHandler: (payload: UserCreatedPayload) => Promise<void>): Promise<void> {
      if (activeConsumer) {
        await activeConsumer.close();
        activeConsumer = null;
      }
      const config = c.config;
      if (config.eventConsumerOverride) {
        await config.eventConsumerOverride.start();
        activeConsumer = config.eventConsumerOverride;
      } else {
        c.eventConsumer.onUserCreated(userCreatedHandler);
        c.eventConsumer.onDomainEvent(async (envelope) => {
          await c.evaluateComplianceUseCase.execute(envelope);
        });
        await c.eventConsumer.start();
        activeConsumer = c.eventConsumer;
      }
    },
    setupAuditLogging(): void {
      const channel = c.eventConsumer.getChannel();
      if (channel) {
        const auditFailClosed = process.env.AUDIT_FAIL_CLOSED === "true";
        const publisher = new RabbitMqAuditPublisher(channel);
        const auditLogger = wrapWithAudit(baseLogger, publisher, "compliance-service", {
          failClosed: auditFailClosed,
          onUnavailable: (error) => {
            baseLogger.fatal({ err: error }, "Audit unavailable in compliance-service (fail-closed enabled).");
            process.exit(1);
          },
        });
        setLogger(auditLogger);
        baseLogger.info({ auditFailClosed }, "Auditoria de logs centralizada ativada para compliance-service");
      }
    },
    async disconnect(): Promise<void> {
      if (activeConsumer) {
        await activeConsumer.close();
        activeConsumer = null;
      }
      await c.prisma.$disconnect();
      c.redis.disconnect();
    },
    async runRetentionSweep(
      retentionDays: number,
      batchSize: number,
      scopedStatuses: Array<"resolvida" | "dispensada">
    ) {
      return c.runRetentionSweepUseCase.execute({ retentionDays, batchSize, scopedStatuses });
    },
  };
}

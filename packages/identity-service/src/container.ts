import { createContainer as createAwilixContainer, asValue, asFunction } from "awilix";
import { PrismaClient } from "../generated/prisma-client";
import Redis from "ioredis";
import {
  RedisCacheAdapter,
  type ICacheService,
  logger as baseLogger,
  setLogger,
  wrapWithAudit,
  RabbitMqAuditPublisher,
  RedisAuthzVersionChecker,
  type IAuthzVersionChecker,
} from "@lframework/shared";
import { PrismaUserRepository } from "./adapters/driven/persistence/prisma-user.repository";
import { PrismaUserOAuthRegistrationPersistence } from "./adapters/driven/persistence/prisma-user-oauth-registration.repository";
import { PrismaOAuthAccountRepository } from "./adapters/driven/persistence/prisma-oauth-account.repository";
import { PrismaOutboxRepository } from "./adapters/driven/persistence/prisma-outbox.repository";
import { RabbitMqEventPublisherAdapter } from "./adapters/driven/messaging/rabbitmq-event-publisher.adapter";
import { OutboxRelayAdapter } from "./adapters/driven/messaging/outbox-relay.adapter";
import type { IEventPublisher } from "./application/ports/event-publisher.port";
import type { IOutboxRepository } from "./application/ports/outbox-repository.port";
import { UserCreatedNotifierAdapter } from "./adapters/driven/notifiers/user-created-notifier.adapter";
import { JwtTokenService } from "./adapters/driven/auth/jwt-token.service";
import { GoogleOAuthProvider } from "./adapters/driven/auth/google-oauth.provider";
import { GitHubOAuthProvider } from "./adapters/driven/auth/github-oauth.provider";
import { BcryptPasswordHasher } from "./adapters/driven/auth/bcrypt-password-hasher.adapter";
import type { IOAuthProvider } from "./application/ports/oauth-provider.port";
import { CreateUserUseCase } from "./application/use-cases/create-user.use-case";
import { GetUserByIdUseCase } from "./application/use-cases/get-user-by-id.use-case";
import { ListUsersUseCase } from "./application/use-cases/list-users.use-case";
import { AssignUserRolesUseCase } from "./application/use-cases/assign-user-role.use-case";
import { GetCurrentUserUseCase } from "./application/use-cases/get-current-user.use-case";
import { OAuthCallbackUseCase } from "./application/use-cases/oauth-callback.use-case";
import { LoginUseCase } from "./application/use-cases/login.use-case";
import { LogoutUseCase } from "./application/use-cases/logout.use-case";
import { AnonymizeInactiveUsersUseCase } from "./application/use-cases/anonymize-inactive-users.use-case";
import { UpdateUserSecurityUseCase } from "./application/use-cases/update-user-security.use-case";
import { DeactivateUserUseCase } from "./application/use-cases/deactivate-user.use-case";
import { UserController } from "./adapters/driving/http/user.controller";
import { AuthController } from "./adapters/driving/http/auth.controller";
import { createAuthMiddleware } from "@lframework/shared";
import { createUserRoutes } from "./adapters/driving/http/routes";
import { createAuthRoutes } from "./adapters/driving/http/auth.routes";
import { mapApplicationErrorToHttp } from "./adapters/driving/http/error-to-http.mapper";
import {
  requirePermissionWithAudit,
  requireSelfOrPermissionWithAudit,
} from "./adapters/driving/http/authorization.middleware";
import { PERMISSIONS } from "./domain/types";

/** Optional event publisher for tests (no-op connect/disconnect). When set, RabbitMQ is not used. */
export type TestEventPublisher = IEventPublisher & {
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
};

export interface ContainerConfig {
  databaseUrl: string;
  redisUrl: string;
  rabbitmqUrl: string;
  jwtSecret: string;
  jwtExpiresInSeconds: number;
  baseUrl: string;
  googleOAuth?: { clientId: string; clientSecret: string };
  githubOAuth?: { clientId: string; clientSecret: string };
  googleProviderOverride?: IOAuthProvider;
  githubProviderOverride?: IOAuthProvider;
  /** When set, used instead of RabbitMQ (e.g. no-op in integration tests). */
  eventPublisherOverride?: TestEventPublisher;
  /** When set, used instead of Redis cache (e.g. no-op in integration tests). */
  cacheOverride?: ICacheService;
}

/** Tipo do cradle (dependências resolvidas) para type-safety. */
interface IdentityCradle {
  config: ContainerConfig;
  prisma: PrismaClient;
  redis: Redis;
  cache: RedisCacheAdapter;
  authzVersionChecker: IAuthzVersionChecker;
  userRepository: PrismaUserRepository;
  userOAuthRegistrationPersistence: PrismaUserOAuthRegistrationPersistence;
  oauthAccountRepository: PrismaOAuthAccountRepository;
  outboxRepository: IOutboxRepository;
  eventPublisher: IEventPublisher & { connect?: () => Promise<void>; disconnect?: () => Promise<void> };
  tokenService: JwtTokenService;
  passwordHasher: BcryptPasswordHasher;
  googleProvider: IOAuthProvider | null;
  githubProvider: IOAuthProvider | null;
  baseUrl: string;
  jwtExpiresInSeconds: number;
  userCreatedNotifier: UserCreatedNotifierAdapter;
  createUserUseCase: CreateUserUseCase;
  getUserByIdUseCase: GetUserByIdUseCase;
  listUsersUseCase: ListUsersUseCase;
  getCurrentUserUseCase: GetCurrentUserUseCase;
  oauthCallbackUseCase: OAuthCallbackUseCase;
  loginUseCase: LoginUseCase;
  logoutUseCase: LogoutUseCase;
  anonymizeInactiveUsersUseCase: AnonymizeInactiveUsersUseCase;
  assignUserRolesUseCase: AssignUserRolesUseCase;
  updateUserSecurityUseCase: UpdateUserSecurityUseCase;
  deactivateUserUseCase: DeactivateUserUseCase;
  userController: UserController;
  authController: AuthController;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
  requireUsersCreate: ReturnType<typeof requirePermissionWithAudit>;
  requireUsersReadAny: ReturnType<typeof requirePermissionWithAudit>;
  requireUsersRead: ReturnType<typeof requireSelfOrPermissionWithAudit>;
  requireRolesAssign: ReturnType<typeof requirePermissionWithAudit>;
  requireUsersUpdate: ReturnType<typeof requirePermissionWithAudit>;
  requireUsersDeactivate: ReturnType<typeof requirePermissionWithAudit>;
  userRoutes: ReturnType<typeof createUserRoutes>;
  authRoutes: ReturnType<typeof createAuthRoutes>;
  outboxRelay: OutboxRelayAdapter;
}

/**
 * Container de DI com Awilix.
 * Dependências registradas por nome; resolução automática por parâmetros do construtor.
 */
export function createContainer(config: ContainerConfig) {
  const awilix = createAwilixContainer<IdentityCradle>();

  awilix.register({
    config: asValue(config),

    prisma: asFunction(({ config }: { config: ContainerConfig }) => {
      return new PrismaClient({ datasources: { db: { url: config.databaseUrl } } });
    }).singleton(),

    redis: asFunction(({ config }: { config: ContainerConfig }) => {
      return new Redis(config.redisUrl, {
        connectTimeout: 5000,
        commandTimeout: 5000,
      });
    }).singleton(),

    cache: asFunction(
      ({ config, redis }: { config: ContainerConfig; redis: Redis }) =>
        config.cacheOverride ?? new RedisCacheAdapter(redis)
    ).singleton(),

    authzVersionChecker: asFunction(
      ({ redis }: { redis: Redis }) => new RedisAuthzVersionChecker(redis)
    ).singleton(),

    userRepository: asFunction(
      (cradle: IdentityCradle) => new PrismaUserRepository(cradle.prisma, cradle.authzVersionChecker)
    ).singleton(),
    userOAuthRegistrationPersistence: asFunction(
      (cradle: IdentityCradle) =>
        new PrismaUserOAuthRegistrationPersistence(cradle.prisma)
    ).singleton(),
    oauthAccountRepository: asFunction(
      (cradle: IdentityCradle) =>
        new PrismaOAuthAccountRepository(cradle.prisma)
    ).singleton(),
    outboxRepository: asFunction(
      (cradle: IdentityCradle) => new PrismaOutboxRepository(cradle.prisma)
    ).singleton(),

    eventPublisher: asFunction(({ config }: { config: ContainerConfig }) => {
      return config.eventPublisherOverride ?? new RabbitMqEventPublisherAdapter(config.rabbitmqUrl);
    }).singleton(),

    tokenService: asFunction(({ config }: { config: ContainerConfig }) => {
      return new JwtTokenService({
        secret: config.jwtSecret,
        expiresInSeconds: config.jwtExpiresInSeconds,
      });
    }).singleton(),

    passwordHasher: asFunction(() => new BcryptPasswordHasher()).singleton(),

    googleProvider: asFunction(({ config }: { config: ContainerConfig }) => {
      if (config.googleProviderOverride) return config.googleProviderOverride;
      if (!config.googleOAuth) return null;
      return new GoogleOAuthProvider({
        clientId: config.googleOAuth.clientId,
        clientSecret: config.googleOAuth.clientSecret,
      });
    }).singleton(),

    githubProvider: asFunction(({ config }: { config: ContainerConfig }) => {
      if (config.githubProviderOverride) return config.githubProviderOverride;
      if (!config.githubOAuth) return null;
      return new GitHubOAuthProvider({
        clientId: config.githubOAuth.clientId,
        clientSecret: config.githubOAuth.clientSecret,
      });
    }).singleton(),

    baseUrl: asFunction(({ config }: { config: ContainerConfig }) => config.baseUrl).singleton(),
    jwtExpiresInSeconds: asFunction(
      ({ config }: { config: ContainerConfig }) => config.jwtExpiresInSeconds
    ).singleton(),

    userCreatedNotifier: asFunction(
      (cradle: IdentityCradle) =>
        new UserCreatedNotifierAdapter(cradle.cache)
    ).singleton(),

    createUserUseCase: asFunction(
      (cradle: IdentityCradle) =>
        new CreateUserUseCase(cradle.userRepository, cradle.userCreatedNotifier, cradle.passwordHasher)
    ).singleton(),

    getUserByIdUseCase: asFunction(
      (cradle: IdentityCradle) =>
        new GetUserByIdUseCase(cradle.userRepository, cradle.cache)
    ).singleton(),
    listUsersUseCase: asFunction(
      (cradle: IdentityCradle) =>
        new ListUsersUseCase(cradle.userRepository)
    ).singleton(),

    getCurrentUserUseCase: asFunction(
      (cradle: IdentityCradle) =>
        new GetCurrentUserUseCase(cradle.userRepository)
    ).singleton(),

    assignUserRolesUseCase: asFunction(
      (cradle: IdentityCradle) =>
        new AssignUserRolesUseCase(cradle.userRepository)
    ).singleton(),

    updateUserSecurityUseCase: asFunction(
      (cradle: IdentityCradle) =>
        new UpdateUserSecurityUseCase(cradle.userRepository)
    ).singleton(),

    deactivateUserUseCase: asFunction(
      (cradle: IdentityCradle) =>
        new DeactivateUserUseCase(cradle.userRepository)
    ).singleton(),

    oauthCallbackUseCase: asFunction(
      (cradle: IdentityCradle) =>
        new OAuthCallbackUseCase(
          cradle.userRepository,
          cradle.oauthAccountRepository,
          cradle.userOAuthRegistrationPersistence,
          cradle.tokenService,
          cradle.userCreatedNotifier,
          cradle.outboxRepository
        )
    ).singleton(),

    loginUseCase: asFunction(
      (cradle: IdentityCradle) =>
        new LoginUseCase(
          cradle.userRepository,
          cradle.passwordHasher,
          cradle.tokenService,
          cradle.outboxRepository
        )
    ).singleton(),

    logoutUseCase: asFunction(
      (cradle: IdentityCradle) =>
        new LogoutUseCase(cradle.userRepository, cradle.outboxRepository)
    ).singleton(),
    anonymizeInactiveUsersUseCase: asFunction(
      (cradle: IdentityCradle) =>
        new AnonymizeInactiveUsersUseCase(cradle.prisma, cradle.outboxRepository)
    ).singleton(),

    userController: asFunction(
      (cradle: IdentityCradle) =>
        new UserController(
          cradle.createUserUseCase,
          cradle.getUserByIdUseCase,
          cradle.assignUserRolesUseCase,
          cradle.listUsersUseCase,
          cradle.updateUserSecurityUseCase,
          cradle.deactivateUserUseCase
        )
    ).singleton(),

    authController: asFunction(
      (cradle: IdentityCradle) =>
        new AuthController(
          cradle.getCurrentUserUseCase,
          cradle.oauthCallbackUseCase,
          cradle.googleProvider,
          cradle.githubProvider,
          cradle.baseUrl,
          cradle.cache,
          cradle.jwtExpiresInSeconds,
          cradle.loginUseCase,
          cradle.createUserUseCase,
          cradle.tokenService,
          cradle.logoutUseCase
        )
    ).singleton(),

    authMiddleware: asFunction(
      ({ tokenService, authzVersionChecker }: { tokenService: JwtTokenService; authzVersionChecker: IAuthzVersionChecker }) =>
        createAuthMiddleware(
          (token) => tokenService.verify(token),
          authzVersionChecker
        )
    ).singleton(),

    requireUsersCreate: asFunction(
      ({ outboxRepository }: { outboxRepository: IOutboxRepository }) =>
        requirePermissionWithAudit(outboxRepository, PERMISSIONS.USERS_CREATE, "POST /api/users")
    ).singleton(),
    requireUsersReadAny: asFunction(
      ({ outboxRepository }: { outboxRepository: IOutboxRepository }) =>
        requirePermissionWithAudit(outboxRepository, PERMISSIONS.USERS_READ_ANY, "GET /api/users")
    ).singleton(),

    requireUsersRead: asFunction(
      ({ outboxRepository }: { outboxRepository: IOutboxRepository }) =>
        requireSelfOrPermissionWithAudit(
          outboxRepository,
          PERMISSIONS.USERS_READ_SELF,
          PERMISSIONS.USERS_READ_ANY,
          "GET /api/users/:id"
        )
    ).singleton(),

    requireRolesAssign: asFunction(
      ({ outboxRepository }: { outboxRepository: IOutboxRepository }) =>
        requirePermissionWithAudit(
          outboxRepository,
          PERMISSIONS.ROLES_ASSIGN,
          "PUT /api/users/:id/roles"
        )
    ).singleton(),

    requireUsersUpdate: asFunction(
      ({ outboxRepository }: { outboxRepository: IOutboxRepository }) =>
        requirePermissionWithAudit(
          outboxRepository,
          PERMISSIONS.USERS_UPDATE,
          "PATCH /api/users/:id/security"
        )
    ).singleton(),

    requireUsersDeactivate: asFunction(
      ({ outboxRepository }: { outboxRepository: IOutboxRepository }) =>
        requirePermissionWithAudit(
          outboxRepository,
          PERMISSIONS.USERS_DEACTIVATE,
          "DELETE /api/users/:id"
        )
    ).singleton(),

    userRoutes: asFunction(
      ({
        userController,
        authMiddleware,
        requireUsersCreate,
        requireUsersReadAny,
        requireUsersRead,
        requireRolesAssign,
        requireUsersUpdate,
        requireUsersDeactivate,
      }: {
        userController: UserController;
        authMiddleware: ReturnType<typeof createAuthMiddleware>;
        requireUsersCreate: ReturnType<typeof requirePermissionWithAudit>;
        requireUsersReadAny: ReturnType<typeof requirePermissionWithAudit>;
        requireUsersRead: ReturnType<typeof requireSelfOrPermissionWithAudit>;
        requireRolesAssign: ReturnType<typeof requirePermissionWithAudit>;
        requireUsersUpdate: ReturnType<typeof requirePermissionWithAudit>;
        requireUsersDeactivate: ReturnType<typeof requirePermissionWithAudit>;
      }) => createUserRoutes(
        userController,
        authMiddleware,
        requireUsersCreate,
        requireUsersReadAny,
        requireUsersRead,
        requireRolesAssign,
        requireUsersUpdate,
        requireUsersDeactivate
      )
    ).singleton(),

    authRoutes: asFunction(
      ({
        authController,
        authMiddleware,
      }: {
        authController: AuthController;
        authMiddleware: ReturnType<typeof createAuthMiddleware>;
      }) => createAuthRoutes(authController, authMiddleware)
    ).singleton(),

    outboxRelay: asFunction(
      (cradle: IdentityCradle) =>
        new OutboxRelayAdapter(cradle.prisma, cradle.eventPublisher)
    ).singleton(),
  });

  const c = awilix.cradle;

  return {
    get prisma() {
      return c.prisma;
    },
    get redis() {
      return c.redis;
    },
    get userRoutes() {
      return c.userRoutes;
    },
    get authRoutes() {
      return c.authRoutes;
    },
    mapApplicationErrorToHttp,
    async connectRabbitMQ(): Promise<void> {
      const ep = c.eventPublisher as { connect?: () => Promise<void> };
      if (ep.connect) await ep.connect();
    },
    setupAuditLogging(): void {
      const ep = c.eventPublisher as RabbitMqEventPublisherAdapter;
      const channel = ep.getChannel();
      if (channel) {
        const publisher = new RabbitMqAuditPublisher(channel);
        const auditLogger = wrapWithAudit(baseLogger, publisher, "identity-service");
        setLogger(auditLogger);
        baseLogger.info("Auditoria de logs centralizada ativada para identity-service");
      }
    },
    startOutboxRelay(intervalMs: number = 2_000): void {
      c.outboxRelay.start(intervalMs);
    },
    async disconnect(): Promise<void> {
      c.outboxRelay.stop();
      const ep = c.eventPublisher as { disconnect?: () => Promise<void> };
      if (ep.disconnect) await ep.disconnect();
      await c.prisma.$disconnect();
      c.redis.disconnect();
    },
    async runInactiveUserAnonymization(retentionDays: number, batchSize: number): Promise<void> {
      await c.anonymizeInactiveUsersUseCase.execute({ retentionDays, batchSize });
    },
  };
}

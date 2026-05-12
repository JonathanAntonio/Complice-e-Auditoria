import type Redis from "ioredis";
import type { IAuthzVersionChecker } from "./authz-version-checker.port";
import { logger } from "../logger";

export interface RedisAuthzVersionCheckerOptions {
  /** Prefixo para as chaves no Redis. Default: 'authz:v:' */
  keyPrefix?: string;
  /** TTL em segundos para a versão no cache. Default: 86400 (24h) */
  ttlSeconds?: number;
}

/**
 * Implementação de IAuthzVersionChecker usando Redis.
 */
export class RedisAuthzVersionChecker implements IAuthzVersionChecker {
  private readonly keyPrefix: string;
  private readonly ttlSeconds: number;

  constructor(
    private readonly redis: Redis,
    options: RedisAuthzVersionCheckerOptions = {}
  ) {
    this.keyPrefix = options.keyPrefix ?? "authz:v:";
    this.ttlSeconds = options.ttlSeconds ?? 86400;
  }

  async getLatestVersion(userId: string): Promise<number | null> {
    try {
      const key = `${this.keyPrefix}${userId}`;
      const value = await this.redis.get(key);
      if (value === null) return null;
      const version = parseInt(value, 10);
      return isNaN(version) ? null : version;
    } catch (err) {
      logger.error({ err, userId }, "Failed to get latest authz version from Redis");
      return null;
    }
  }

  async updateVersion(userId: string, version: number): Promise<void> {
    try {
      const key = `${this.keyPrefix}${userId}`;
      await this.redis.set(key, version.toString(), "EX", this.ttlSeconds);
    } catch (err) {
      logger.error({ err, userId, version }, "Failed to update authz version in Redis");
    }
  }
}

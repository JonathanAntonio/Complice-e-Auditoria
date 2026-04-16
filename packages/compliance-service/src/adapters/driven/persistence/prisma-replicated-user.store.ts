import type { IReplicatedUserStore } from "../../../application/ports/replicated-user-store.port";
import type { UserCreatedPayload } from "@lframework/shared";

interface ComplianceDb {
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
  $queryRawUnsafe<T>(query: string, ...values: unknown[]): Promise<T>;
}

/**
 * Adapter: replicates user data from user.created events into local table (Data Replication).
 */
export class PrismaReplicatedUserStore implements IReplicatedUserStore {
  constructor(private readonly prisma: ComplianceDb) {}

  async upsertFromUserCreated(payload: UserCreatedPayload): Promise<void> {
    const now = new Date();
    let occurredAt: Date;
    if (payload.occurredAt != null && payload.occurredAt !== "") {
      occurredAt = new Date(payload.occurredAt);
      if (Number.isNaN(occurredAt.getTime())) {
        occurredAt = now;
      }
    } else {
      occurredAt = now;
    }

    const updated = await this.prisma.$executeRawUnsafe(
      `
      UPDATE "replicated_users"
      SET
        "email" = $2,
        "name" = $3,
        "last_event_at" = $4,
        "last_event_occurred_at" = $5
      WHERE "id" = $1
        AND ("last_event_occurred_at" IS NULL OR "last_event_occurred_at" <= $5)
      `,
      payload.userId,
      payload.email,
      payload.name,
      now,
      occurredAt
    );

    if (Number(updated) > 0) {
      return;
    }

    const existing = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "replicated_users" WHERE "id" = $1 LIMIT 1`,
      payload.userId
    );

    if (existing.length > 0) {
      return;
    }

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "replicated_users" (
        "id", "email", "name", "created_at", "last_event_at", "last_event_occurred_at"
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      )
      ON CONFLICT ("id") DO NOTHING
      `,
      payload.userId,
      payload.email,
      payload.name,
      occurredAt,
      now,
      occurredAt
    );
  }
}

import { Item } from "../../../domain/entities/item.entity";
import type { IItemRepository } from "../../../application/ports";
import type { ViolationStatus } from "../../../domain/types";

interface ComplianceDb {
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
  $queryRawUnsafe<T>(query: string, ...values: unknown[]): Promise<T>;
}

export class PrismaItemRepository implements IItemRepository {
  constructor(private readonly prisma: ComplianceDb) {}

  async save(item: Item): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "items" (
        "id", "name", "price_amount", "price_currency", "status",
        "resolved_at", "dismissed_at", "dismissal_justification", "dismissal_approved_by", "retention_until", "created_at"
      ) VALUES (
        $1, $2, $3, $4, $5::"ViolationStatus", $6, $7, $8, $9, $10, $11
      )
      ON CONFLICT ("id") DO UPDATE SET
        "name" = EXCLUDED."name",
        "price_amount" = EXCLUDED."price_amount",
        "price_currency" = EXCLUDED."price_currency",
        "status" = EXCLUDED."status",
        "resolved_at" = EXCLUDED."resolved_at",
        "dismissed_at" = EXCLUDED."dismissed_at",
        "dismissal_justification" = EXCLUDED."dismissal_justification",
        "dismissal_approved_by" = EXCLUDED."dismissal_approved_by",
        "retention_until" = EXCLUDED."retention_until"
      `,
      item.id,
      item.name,
      item.price.amount,
      item.price.currency,
      item.status,
      item.resolvedAt,
      item.dismissedAt,
      item.dismissalJustification,
      item.dismissalApprovedBy,
      item.retentionUntil,
      item.createdAt
    );
  }

  async findById(id: string): Promise<Item | null> {
    const rows = await this.prisma.$queryRawUnsafe<Array<ItemRow>>(
      `
      SELECT
        "id",
        "name",
        "price_amount" AS "priceAmount",
        "price_currency" AS "priceCurrency",
        "status"::text AS "status",
        "resolved_at" AS "resolvedAt",
        "dismissed_at" AS "dismissedAt",
        "dismissal_justification" AS "dismissalJustification",
        "dismissal_approved_by" AS "dismissalApprovedBy",
        "retention_until" AS "retentionUntil",
        "created_at" AS "createdAt"
      FROM "items"
      WHERE "id" = $1
      LIMIT 1
      `,
      id
    );
    const row = rows[0];
    if (!row) return null;
    return Item.reconstitute(
      row.id,
      row.name,
      row.priceAmount,
      row.priceCurrency,
      row.createdAt,
      row.status,
      row.resolvedAt,
      row.dismissedAt,
      row.dismissalJustification,
      row.dismissalApprovedBy,
      row.retentionUntil
    );
  }

  async findAll(): Promise<Item[]> {
    const rows = await this.prisma.$queryRawUnsafe<Array<ItemRow>>(
      `
      SELECT
        "id",
        "name",
        "price_amount" AS "priceAmount",
        "price_currency" AS "priceCurrency",
        "status"::text AS "status",
        "resolved_at" AS "resolvedAt",
        "dismissed_at" AS "dismissedAt",
        "dismissal_justification" AS "dismissalJustification",
        "dismissal_approved_by" AS "dismissalApprovedBy",
        "retention_until" AS "retentionUntil",
        "created_at" AS "createdAt"
      FROM "items"
      ORDER BY "created_at" DESC
      `
    );
    return rows.map((row) =>
      Item.reconstitute(
        row.id,
        row.name,
        row.priceAmount,
        row.priceCurrency,
        row.createdAt,
        row.status,
        row.resolvedAt,
        row.dismissedAt,
        row.dismissalJustification,
        row.dismissalApprovedBy,
        row.retentionUntil
      )
    );
  }
}

interface ItemRow {
  id: string;
  name: string;
  priceAmount: number;
  priceCurrency: string;
  status: ViolationStatus;
  resolvedAt: Date | null;
  dismissedAt: Date | null;
  dismissalJustification: string | null;
  dismissalApprovedBy: string | null;
  retentionUntil: Date | null;
  createdAt: Date;
}

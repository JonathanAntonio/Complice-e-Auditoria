import { Item } from "../../domain/entities/item.entity";
import { Money } from "../../domain/value-objects/money.vo";
import type { IItemRepository } from "../ports/item-repository.port";
import type { IItemsListCacheInvalidator } from "../ports/items-list-cache-invalidator.port";
import type { UpdateItemDto } from "../dtos/update-item.dto";
import type { ItemResponseDto } from "../dtos/item-response.dto";
import { InvalidItemError, ItemNotFoundError } from "../errors";

export class UpdateItemUseCase {
  constructor(
    private readonly itemRepository: IItemRepository,
    private readonly itemsListCacheInvalidator: IItemsListCacheInvalidator
  ) {}

  async execute(itemId: string, dto: UpdateItemDto): Promise<ItemResponseDto> {
    const normalizedId = itemId.trim();
    if (!normalizedId) {
      throw new InvalidItemError("Item id is required");
    }

    const existing = await this.itemRepository.findById(normalizedId);
    if (!existing) {
      throw new ItemNotFoundError("Item not found");
    }

    try {
      const nextName = dto.name ?? existing.name;
      const nextPriceAmount = dto.priceAmount ?? existing.price.amount;
      const nextPriceCurrency = dto.priceCurrency ?? existing.price.currency;
      const price = Money.create(nextPriceAmount, nextPriceCurrency);
      const updated = Item.reconstitute(
        existing.id,
        nextName,
        price.amount,
        price.currency,
        existing.createdAt,
        existing.status,
        existing.resolvedAt,
        existing.dismissedAt,
        existing.retentionUntil
      );

      if (dto.status) {
        updated.transitionStatus(dto.status, new Date());
      }

      await this.itemRepository.save(updated);
      await this.itemsListCacheInvalidator.invalidate();

      return {
        id: updated.id,
        name: updated.name,
        priceAmount: updated.price.amount,
        priceCurrency: updated.price.currency,
        status: updated.status,
        resolvedAt: updated.resolvedAt?.toISOString() ?? null,
        dismissedAt: updated.dismissedAt?.toISOString() ?? null,
        retentionUntil: updated.retentionUntil?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
      };
    } catch (err) {
      throw new InvalidItemError(err instanceof Error ? err.message : "Invalid item");
    }
  }
}

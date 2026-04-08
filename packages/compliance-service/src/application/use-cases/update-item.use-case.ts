import { Item } from "../../domain/entities/item.entity";
import { Money } from "../../domain/value-objects/money.vo";
import type { IItemRepository } from "../ports/item-repository.port";
import type { IItemsListCacheInvalidator } from "../ports/items-list-cache-invalidator.port";
import type { CreateItemDto } from "../dtos/create-item.dto";
import type { ItemResponseDto } from "../dtos/item-response.dto";
import { InvalidItemError, ItemNotFoundError } from "../errors";

export class UpdateItemUseCase {
  constructor(
    private readonly itemRepository: IItemRepository,
    private readonly itemsListCacheInvalidator: IItemsListCacheInvalidator
  ) {}

  async execute(itemId: string, dto: CreateItemDto): Promise<ItemResponseDto> {
    const normalizedId = itemId.trim();
    if (!normalizedId) {
      throw new InvalidItemError("Item id is required");
    }

    const existing = await this.itemRepository.findById(normalizedId);
    if (!existing) {
      throw new ItemNotFoundError("Item not found");
    }

    try {
      const price = Money.create(dto.priceAmount, dto.priceCurrency);
      const updated = Item.reconstitute(existing.id, dto.name, price.amount, price.currency, existing.createdAt);
      await this.itemRepository.save(updated);
      await this.itemsListCacheInvalidator.invalidate();

      return {
        id: updated.id,
        name: updated.name,
        priceAmount: updated.price.amount,
        priceCurrency: updated.price.currency,
        createdAt: updated.createdAt.toISOString(),
      };
    } catch (err) {
      throw new InvalidItemError(err instanceof Error ? err.message : "Invalid item");
    }
  }
}

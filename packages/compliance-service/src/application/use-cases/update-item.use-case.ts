import { Item } from "../../domain/entities/item.entity";
import { Money } from "../../domain/value-objects/money.vo";
import type { IItemRepository } from "../ports/item-repository.port";
import type { IItemsListCacheInvalidator } from "../ports/items-list-cache-invalidator.port";
import type { UpdateItemDto } from "../dtos/update-item.dto";
import type { ItemResponseDto } from "../dtos/item-response.dto";
import { InvalidItemError, ItemNotFoundError } from "../errors";
import type { INotificationDispatcher } from "../ports";

interface CriticalNotificationRecipients {
  scopeOwner: string;
  areaManager: string;
  complianceOfficer: string;
}

export class UpdateItemUseCase {
  constructor(
    private readonly itemRepository: IItemRepository,
    private readonly itemsListCacheInvalidator: IItemsListCacheInvalidator,
    private readonly notificationDispatcher: INotificationDispatcher,
    private readonly notificationRecipients: CriticalNotificationRecipients
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
        existing.dismissalJustification,
        existing.dismissalApprovedBy,
        existing.retentionUntil
      );

      if (dto.status) {
        const nextPriceAmount = dto.priceAmount ?? existing.price.amount;
        const isCriticalViolation = nextPriceAmount >= 400;
        updated.transitionStatus(dto.status, new Date(), {
          dismissalJustification: dto.dismissalJustification,
          dismissalApprovedBy: dto.dismissalApprovedBy,
          isCritical: isCriticalViolation,
        });
      }

      await this.itemRepository.save(updated);
      await this.itemsListCacheInvalidator.invalidate();
      await this.dispatchCriticalNotificationIfNeeded(updated.name, updated.price.amount);

      return {
        id: updated.id,
        name: updated.name,
        priceAmount: updated.price.amount,
        priceCurrency: updated.price.currency,
        status: updated.status,
        resolvedAt: updated.resolvedAt?.toISOString() ?? null,
        dismissedAt: updated.dismissedAt?.toISOString() ?? null,
        dismissalJustification: updated.dismissalJustification,
        dismissalApprovedBy: updated.dismissalApprovedBy,
        retentionUntil: updated.retentionUntil?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
      };
    } catch (err) {
      throw new InvalidItemError(err instanceof Error ? err.message : "Invalid item");
    }
  }

  private async dispatchCriticalNotificationIfNeeded(title: string, priceAmount: number): Promise<void> {
    if (priceAmount < 400) return;
    try {
      await this.notificationDispatcher.dispatchViolationNotification({
        title,
        severity: "critical",
        message: `Violação crítica atualizada: ${title}`,
        scopeOwner: this.notificationRecipients.scopeOwner,
        areaManager: this.notificationRecipients.areaManager,
        complianceOfficer: this.notificationRecipients.complianceOfficer,
      });
    } catch {
      // Best-effort: atualização de violação não deve falhar por indisponibilidade de notificação.
    }
  }
}

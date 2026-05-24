import { randomUUID } from "crypto";
import { Item } from "../../domain/entities/item.entity";
import { Money } from "../../domain/value-objects/money.vo";
import type { IItemRepository } from "../ports/item-repository.port";
import type { IItemsListCacheInvalidator } from "../ports/items-list-cache-invalidator.port";
import type { CreateItemDto } from "../dtos/create-item.dto";
import type { ItemResponseDto } from "../dtos/item-response.dto";
import { InvalidItemError } from "../errors";
import type { INotificationDispatcher } from "../ports";

interface CriticalNotificationRecipients {
  scopeOwner: string;
  areaManager: string;
  complianceOfficer: string;
}

export class CreateItemUseCase {
  constructor(
    private readonly itemRepository: IItemRepository,
    private readonly itemsListCacheInvalidator: IItemsListCacheInvalidator,
    private readonly notificationDispatcher: INotificationDispatcher,
    private readonly notificationRecipients: CriticalNotificationRecipients
  ) {}

  async execute(dto: CreateItemDto): Promise<ItemResponseDto> {
    const id = randomUUID();
    try {
      const price = Money.create(dto.priceAmount, dto.priceCurrency);
      const item = Item.create(id, dto.name, price);
      await this.itemRepository.save(item);

      await this.itemsListCacheInvalidator.invalidate();
      await this.dispatchCriticalNotificationIfNeeded(item.name, item.price.amount);

      const result: ItemResponseDto = {
        id: item.id,
        name: item.name,
        priceAmount: item.price.amount,
        priceCurrency: item.price.currency,
        status: item.status,
        resolvedAt: item.resolvedAt?.toISOString() ?? null,
        dismissedAt: item.dismissedAt?.toISOString() ?? null,
        dismissalJustification: item.dismissalJustification,
        dismissalApprovedBy: item.dismissalApprovedBy,
        retentionUntil: item.retentionUntil?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      };
      return result;
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
        message: `Violação crítica criada: ${title}`,
        scopeOwner: this.notificationRecipients.scopeOwner,
        areaManager: this.notificationRecipients.areaManager,
        complianceOfficer: this.notificationRecipients.complianceOfficer,
      });
    } catch {
      // Best-effort: criação de violação não deve falhar por indisponibilidade de notificação.
    }
  }
}

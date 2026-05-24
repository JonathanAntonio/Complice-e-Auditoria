import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateItemUseCase } from "./create-item.use-case";
import { InvalidItemError } from "../errors";
import type { IItemRepository } from "../../ports/item-repository.port";
import type { IItemsListCacheInvalidator } from "../ports/items-list-cache-invalidator.port";
import type { INotificationDispatcher } from "../ports";

describe("CreateItemUseCase", () => {
  let itemRepository: IItemRepository;
  let itemsListCacheInvalidator: IItemsListCacheInvalidator;
  let notificationDispatcher: INotificationDispatcher;

  beforeEach(() => {
    itemRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findAll: vi.fn(),
    };
    itemsListCacheInvalidator = {
      invalidate: vi.fn().mockResolvedValue(undefined),
    };
    notificationDispatcher = {
      dispatchViolationNotification: vi.fn().mockResolvedValue(undefined),
    };
  });

  it("deve criar item com sucesso e retornar ItemResponseDto", async () => {
    const useCase = new CreateItemUseCase(
      itemRepository,
      itemsListCacheInvalidator,
      notificationDispatcher,
      {
        scopeOwner: "owner@example.com",
        areaManager: "manager@example.com",
        complianceOfficer: "officer@example.com",
      }
    );
    const dto = { name: "Produto X", priceAmount: 9999, priceCurrency: "BRL" };

    const result = await useCase.execute(dto);

    expect(result).toMatchObject({
      name: "Produto X",
      priceAmount: 9999,
      priceCurrency: "BRL",
    });
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(itemRepository.save).toHaveBeenCalled();
    expect(itemsListCacheInvalidator.invalidate).toHaveBeenCalled();
    expect(notificationDispatcher.dispatchViolationNotification).toHaveBeenCalledTimes(1);
  });

  it("deve lançar InvalidItemError quando priceAmount for inválido", async () => {
    const useCase = new CreateItemUseCase(
      itemRepository,
      itemsListCacheInvalidator,
      notificationDispatcher,
      {
        scopeOwner: "owner@example.com",
        areaManager: "manager@example.com",
        complianceOfficer: "officer@example.com",
      }
    );
    const dto = { name: "Item", priceAmount: -100, priceCurrency: "BRL" };

    await expect(useCase.execute(dto)).rejects.toThrow(InvalidItemError);
    expect(itemRepository.save).not.toHaveBeenCalled();
  });

  it("deve lançar InvalidItemError quando repository.save lança", async () => {
    vi.mocked(itemRepository.save).mockRejectedValue(new Error("DB connection failed"));
    const useCase = new CreateItemUseCase(
      itemRepository,
      itemsListCacheInvalidator,
      notificationDispatcher,
      {
        scopeOwner: "owner@example.com",
        areaManager: "manager@example.com",
        complianceOfficer: "officer@example.com",
      }
    );
    const dto = { name: "Item", priceAmount: 100, priceCurrency: "BRL" };

    await expect(useCase.execute(dto)).rejects.toThrow(InvalidItemError);
    expect(itemRepository.save).toHaveBeenCalled();
  });

  it("não dispara notificação para severidade não crítica", async () => {
    const useCase = new CreateItemUseCase(
      itemRepository,
      itemsListCacheInvalidator,
      notificationDispatcher,
      {
        scopeOwner: "owner@example.com",
        areaManager: "manager@example.com",
        complianceOfficer: "officer@example.com",
      }
    );
    await useCase.execute({ name: "Item baixo", priceAmount: 100, priceCurrency: "BRL" });
    expect(notificationDispatcher.dispatchViolationNotification).not.toHaveBeenCalled();
  });
});

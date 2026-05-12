import { logger, type EventEnvelopeV1 } from "@lframework/shared";
import type { IItemRepository } from "../ports/item-repository.port";
import { Item } from "../../domain/entities/item.entity";
import { Money } from "../../domain/value-objects/money.vo";
import { randomUUID } from "crypto";

/**
 * Use Case: Evaluates domain events against compliance rules.
 * For now, it logs the event and creates violations for 'suspect' events.
 */
export class EvaluateComplianceUseCase {
  constructor(
    private readonly itemRepository: IItemRepository
  ) {}

  async execute(envelope: EventEnvelopeV1): Promise<void> {
    const type = envelope.type.toLowerCase();
    
    logger.info(
      { 
        eventId: envelope.eventId, 
        type: envelope.type, 
        producer: envelope.producer 
      }, 
      "Evaluating compliance for domain event"
    );

    // Dummy Rule: Any event with 'suspect' or 'risk' in its type triggers a violation.
    if (type.includes("suspeit") || type.includes("risco") || type.includes("violation")) {
      logger.warn(
        { eventId: envelope.eventId, type: envelope.type },
        "Compliance violation detected by dummy rule"
      );

      const violation = Item.create(
        randomUUID(),
        `Suspect Event Detected: ${envelope.type} (ID: ${envelope.eventId})`,
        Money.create(0, "BRL")
      );

      await this.itemRepository.save(violation);
      
      logger.info(
        { violationId: violation.id, eventId: envelope.eventId },
        "Violation item created in compliance service"
      );
    }
  }
}

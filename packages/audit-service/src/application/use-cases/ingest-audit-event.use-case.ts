import type { EventEnvelopeV1 } from "@lframework/shared";
import type { IAuditLogRepository } from "../ports/audit-log-repository.port";

export class IngestAuditEventUseCase {
  constructor(private readonly repository: IAuditLogRepository) {}

  async execute(envelope: EventEnvelopeV1): Promise<void> {
    await this.repository.saveFromEnvelope(envelope);
  }
}

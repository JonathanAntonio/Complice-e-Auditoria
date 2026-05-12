import type { IAuditLogsClient } from "../ports/audit-logs-client.port";

export class IngestFrontendAuditLogUseCase {
  constructor(private readonly auditClient: IAuditLogsClient) {}

  async execute(payload: unknown): Promise<void> {
    await this.auditClient.ingestFrontendAuditLog(payload);
  }
}

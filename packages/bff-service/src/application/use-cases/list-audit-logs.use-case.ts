import type { AuditLogListDto, AuditLogsQueryDto } from "../dtos/audit-log-response.dto";
import type { IAuditLogsClient } from "../ports/audit-logs-client.port";

export class ListAuditLogsUseCase {
  constructor(private readonly client: IAuditLogsClient) {}

  async execute(token: string, query: AuditLogsQueryDto): Promise<AuditLogListDto> {
    return this.client.listAuditLogs(token, query);
  }
}

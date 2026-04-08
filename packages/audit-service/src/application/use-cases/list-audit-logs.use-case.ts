import type { AuditLogListResponseDto } from "../dtos/audit-log-response.dto";
import type { ListAuditLogsQueryDto } from "../dtos/list-audit-logs-query.dto";
import type { IAuditLogRepository } from "../ports/audit-log-repository.port";

export class ListAuditLogsUseCase {
  constructor(private readonly repository: IAuditLogRepository) {}

  async execute(query: ListAuditLogsQueryDto): Promise<AuditLogListResponseDto> {
    return this.repository.list(query);
  }
}

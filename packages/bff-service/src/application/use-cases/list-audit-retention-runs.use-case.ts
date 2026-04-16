import type { RetentionRunListDto, RetentionRunsQueryDto } from "../dtos/retention-run.dto";
import type { IAuditLogsClient } from "../ports/audit-logs-client.port";

export class ListAuditRetentionRunsUseCase {
  constructor(private readonly client: IAuditLogsClient) {}

  async execute(token: string, query: RetentionRunsQueryDto): Promise<RetentionRunListDto> {
    return this.client.listAuditRetentionRuns(token, query);
  }
}

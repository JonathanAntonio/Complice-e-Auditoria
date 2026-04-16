import type { ListRetentionRunsQueryDto } from "../dtos/list-retention-runs-query.dto";
import type { RetentionRunListResponseDto } from "../dtos/retention-run-response.dto";
import type { IAuditLogRepository } from "../ports/audit-log-repository.port";

export class ListRetentionRunsUseCase {
  constructor(private readonly repository: IAuditLogRepository) {}

  async execute(query: ListRetentionRunsQueryDto): Promise<RetentionRunListResponseDto> {
    return this.repository.listRetentionRuns(query);
  }
}

import type { RetentionRunListDto, RetentionRunsQueryDto } from "../dtos/retention-run.dto";
import type { IComplianceViolationsClient } from "../ports/compliance-violations-client.port";

export class ListComplianceRetentionRunsUseCase {
  constructor(private readonly client: IComplianceViolationsClient) {}

  async execute(token: string, query: RetentionRunsQueryDto): Promise<RetentionRunListDto> {
    return this.client.listRetentionRuns(token, query);
  }
}

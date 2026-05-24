import type { IReportingClient } from "../ports/reporting-client.port";
import type { ReportKpisDto, ReportKpisQueryDto } from "../dtos/report-export.dto";

export class GetReportKpisUseCase {
  constructor(private readonly client: IReportingClient) {}

  async execute(token: string, query: ReportKpisQueryDto): Promise<ReportKpisDto> {
    return this.client.getKpis(token, query);
  }
}

import type { ReportExportJobDto } from "../dtos/report-export.dto";
import type { IReportingClient } from "../ports/reporting-client.port";

export class GetReportExportUseCase {
  constructor(private readonly client: IReportingClient) {}

  async execute(token: string, id: string): Promise<ReportExportJobDto> {
    return this.client.getExport(token, id);
  }
}

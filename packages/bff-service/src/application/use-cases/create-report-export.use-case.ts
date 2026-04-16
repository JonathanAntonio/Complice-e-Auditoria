import type { CreateReportExportDto, ReportExportJobDto } from "../dtos/report-export.dto";
import type { IReportingClient } from "../ports/reporting-client.port";

export class CreateReportExportUseCase {
  constructor(private readonly client: IReportingClient) {}

  async execute(token: string, payload: CreateReportExportDto): Promise<ReportExportJobDto> {
    return this.client.createExport(token, payload);
  }
}

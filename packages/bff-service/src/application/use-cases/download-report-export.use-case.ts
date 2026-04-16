import type { ReportDownloadDto } from "../dtos/report-export.dto";
import type { IReportingClient } from "../ports/reporting-client.port";

export class DownloadReportExportUseCase {
  constructor(private readonly client: IReportingClient) {}

  async execute(token: string, id: string): Promise<ReportDownloadDto> {
    return this.client.downloadExport(token, id);
  }
}

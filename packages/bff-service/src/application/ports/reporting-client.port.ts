import type {
  CreateReportExportDto,
  ReportExportJobDto,
  ReportDownloadDto,
} from "../dtos/report-export.dto";

export interface IReportingClient {
  createExport(token: string, payload: CreateReportExportDto): Promise<ReportExportJobDto>;
  getExport(token: string, id: string): Promise<ReportExportJobDto>;
  downloadExport(token: string, id: string): Promise<ReportDownloadDto>;
}

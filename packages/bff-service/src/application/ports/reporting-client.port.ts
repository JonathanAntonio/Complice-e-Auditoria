import type {
  CreateReportExportDto,
  ReportKpisDto,
  ReportKpisQueryDto,
  ReportExportJobDto,
  ReportDownloadDto,
} from "../dtos/report-export.dto";

export interface IReportingClient {
  getKpis(token: string, query: ReportKpisQueryDto): Promise<ReportKpisDto>;
  createExport(token: string, payload: CreateReportExportDto): Promise<ReportExportJobDto>;
  getExport(token: string, id: string): Promise<ReportExportJobDto>;
  downloadExport(token: string, id: string): Promise<ReportDownloadDto>;
}

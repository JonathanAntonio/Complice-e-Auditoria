import type { AuditLogListDto, AuditLogsQueryDto } from "../dtos/audit-log-response.dto";
import type { RetentionRunListDto, RetentionRunsQueryDto } from "../dtos/retention-run.dto";

export interface IAuditLogsClient {
  listAuditLogs(token: string, query: AuditLogsQueryDto): Promise<AuditLogListDto>;
  listAuditRetentionRuns(token: string, query: RetentionRunsQueryDto): Promise<RetentionRunListDto>;
  ingestFrontendAuditLog(payload: any): Promise<void>;
}

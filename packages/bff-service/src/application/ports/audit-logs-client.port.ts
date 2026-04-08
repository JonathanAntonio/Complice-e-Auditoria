import type { AuditLogListDto, AuditLogsQueryDto } from "../dtos/audit-log-response.dto";

export interface IAuditLogsClient {
  listAuditLogs(token: string, query: AuditLogsQueryDto): Promise<AuditLogListDto>;
}

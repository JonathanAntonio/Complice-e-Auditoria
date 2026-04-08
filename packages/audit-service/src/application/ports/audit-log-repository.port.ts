import type { EventEnvelopeV1 } from "@lframework/shared";
import type { ListAuditLogsQueryDto } from "../dtos/list-audit-logs-query.dto";
import type { AuditLogListResponseDto } from "../dtos/audit-log-response.dto";

export interface IAuditLogRepository {
  saveFromEnvelope(envelope: EventEnvelopeV1): Promise<void>;
  list(query: ListAuditLogsQueryDto): Promise<AuditLogListResponseDto>;
}

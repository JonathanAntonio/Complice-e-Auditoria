import { requestBffAudit } from "../infrastructure/http/bff-audit.api";
import { parseAuditLogsResponseDto } from "./dtos/audit-log.dto";

export async function listAuditLogs(query = {}) {
  const params = new URLSearchParams();
  if (Number.isInteger(query.page) && query.page > 0) params.set("page", `${query.page}`);
  if (Number.isInteger(query.pageSize) && query.pageSize > 0) params.set("pageSize", `${query.pageSize}`);
  if (typeof query.type === "string" && query.type.trim()) params.set("type", query.type.trim());
  if (typeof query.actorId === "string" && query.actorId.trim()) params.set("actorId", query.actorId.trim());
  if (typeof query.severity === "string" && query.severity.trim()) params.set("severity", query.severity.trim());

  const suffix = params.size > 0 ? `/logs?${params.toString()}` : "/logs";

  const payload = await requestBffAudit(suffix, {
    defaultErrorMessage: "Falha ao carregar logs de auditoria.",
  });

  return parseAuditLogsResponseDto(payload);
}

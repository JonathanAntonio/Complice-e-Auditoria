import { requestBffAudit } from "../infrastructure/http/bff-audit.api";
import { requestBffCompliance } from "../infrastructure/http/bff-compliance.api";
import { parseRetentionRunsQueryDto, parseRetentionRunsResponseDto } from "./dtos/retention-run.dto";

export async function listAuditRetentionRuns(query = {}) {
  const dto = parseRetentionRunsQueryDto(query);
  const suffix = toQuerySuffix("/retention/runs", dto);
  const payload = await requestBffAudit(suffix, {
    defaultErrorMessage: "Falha ao carregar execuções de retenção de auditoria.",
  });
  return parseRetentionRunsResponseDto(payload);
}

export async function listComplianceRetentionRuns(query = {}) {
  const dto = parseRetentionRunsQueryDto(query);
  const suffix = toQuerySuffix("/retention/runs", dto);
  const payload = await requestBffCompliance(suffix, {
    defaultErrorMessage: "Falha ao carregar execuções de retenção de compliance.",
  });
  return parseRetentionRunsResponseDto(payload);
}

function toQuerySuffix(basePath, query) {
  const params = new URLSearchParams();
  if (Number.isInteger(query.page) && query.page > 0) params.set("page", `${query.page}`);
  if (Number.isInteger(query.pageSize) && query.pageSize > 0) params.set("pageSize", `${query.pageSize}`);
  if (typeof query.status === "string" && query.status.length > 0) params.set("status", query.status);

  return params.size > 0 ? `${basePath}?${params.toString()}` : basePath;
}

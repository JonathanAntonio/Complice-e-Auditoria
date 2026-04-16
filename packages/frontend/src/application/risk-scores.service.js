import { requestBffRisk } from "../infrastructure/http/bff-risk.api";
import {
  parseRiskEventIngestResultDto,
  parseRiskHistoryQueryDto,
  parseRiskEventInputDto,
  parseRiskScoreHistoryResponseDto,
  parseRiskScoresQueryDto,
  parseRiskScoresResponseDto,
} from "./dtos/risk-score.dto";

export async function listRiskScores(query = {}) {
  const dto = parseRiskScoresQueryDto(query);
  const params = new URLSearchParams();
  if (dto.entityType) params.set("entityType", dto.entityType);
  if (dto.level) params.set("level", dto.level);
  if (dto.search) params.set("search", dto.search);
  if (dto.minScore !== undefined) params.set("minScore", String(dto.minScore));
  if (dto.maxScore !== undefined) params.set("maxScore", String(dto.maxScore));
  if (dto.page !== undefined) params.set("page", String(dto.page));
  if (dto.pageSize !== undefined) params.set("pageSize", String(dto.pageSize));
  if (dto.sortBy) params.set("sortBy", dto.sortBy);
  if (dto.sortDir) params.set("sortDir", dto.sortDir);

  const suffix = params.size > 0 ? `/scores?${params.toString()}` : "/scores";
  const payload = await requestBffRisk(suffix, {
    defaultErrorMessage: "Falha ao carregar pontuações de risco.",
  });

  return parseRiskScoresResponseDto(payload);
}

export async function ingestRiskEvent(input) {
  const dto = parseRiskEventInputDto(input);
  const payload = await requestBffRisk("/events", {
    method: "POST",
    body: dto,
    defaultErrorMessage: "Falha ao registrar evento de risco.",
  });
  return parseRiskEventIngestResultDto(payload);
}

export async function getRiskScoreHistory(entityType, entityId, query = {}) {
  if (!["user", "area", "process"].includes(entityType)) {
    throw new Error("Tipo de entidade inválido.");
  }
  if (typeof entityId !== "string" || entityId.trim().length === 0) {
    throw new Error("ID da entidade inválido.");
  }
  const dto = parseRiskHistoryQueryDto(query);
  const params = new URLSearchParams();
  if (dto.fromUTC) params.set("fromUTC", dto.fromUTC);
  if (dto.toUTC) params.set("toUTC", dto.toUTC);
  if (dto.bucket) params.set("bucket", dto.bucket);
  const suffix = params.size > 0
    ? `/scores/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId.trim())}/history?${params.toString()}`
    : `/scores/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId.trim())}/history`;
  const payload = await requestBffRisk(suffix, {
    defaultErrorMessage: "Falha ao carregar histórico de risco.",
  });
  return parseRiskScoreHistoryResponseDto(payload);
}

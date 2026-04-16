import type {
  RiskEventIngestResultDto,
  RiskEventInputDto,
  RiskScoreHistoryDto,
  RiskScoreHistoryQueryDto,
  RiskScoresListDto,
  RiskScoresQueryDto,
} from "../dtos/risk-score.dto";

export interface IRiskScoresClient {
  listRiskScores(token: string, query: RiskScoresQueryDto): Promise<RiskScoresListDto>;
  getRiskScoreHistory(
    token: string,
    entityType: "user" | "area" | "process",
    entityId: string,
    query: RiskScoreHistoryQueryDto
  ): Promise<RiskScoreHistoryDto>;
  ingestRiskEvent(token: string, payload: RiskEventInputDto): Promise<RiskEventIngestResultDto>;
}

import type { RiskScoreHistoryDto, RiskScoreHistoryQueryDto } from "../dtos/risk-score.dto";
import type { IRiskScoresClient } from "../ports/risk-scores-client.port";

export class GetRiskScoreHistoryUseCase {
  constructor(private readonly client: IRiskScoresClient) {}

  async execute(
    token: string,
    entityType: "user" | "area" | "process",
    entityId: string,
    query: RiskScoreHistoryQueryDto
  ): Promise<RiskScoreHistoryDto> {
    return this.client.getRiskScoreHistory(token, entityType, entityId, query);
  }
}

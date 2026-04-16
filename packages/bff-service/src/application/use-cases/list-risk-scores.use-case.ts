import type { RiskScoresListDto, RiskScoresQueryDto } from "../dtos/risk-score.dto";
import type { IRiskScoresClient } from "../ports/risk-scores-client.port";

export class ListRiskScoresUseCase {
  constructor(private readonly client: IRiskScoresClient) {}

  async execute(token: string, query: RiskScoresQueryDto): Promise<RiskScoresListDto> {
    return this.client.listRiskScores(token, query);
  }
}

import type { RiskEventInputDto } from "../dtos/risk-score.dto";
import type { IRiskScoresClient } from "../ports/risk-scores-client.port";

export class IngestRiskEventUseCase {
  constructor(private readonly client: IRiskScoresClient) {}

  async execute(token: string, payload: RiskEventInputDto) {
    return this.client.ingestRiskEvent(token, payload);
  }
}

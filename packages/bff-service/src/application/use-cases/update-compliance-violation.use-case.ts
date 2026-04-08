import type { IComplianceViolationsClient } from "../ports/compliance-violations-client.port";
import type { UpdateComplianceViolationDto } from "../dtos/update-compliance-violation.dto";

export class UpdateComplianceViolationUseCase {
  constructor(private readonly complianceViolationsClient: IComplianceViolationsClient) {}

  async execute(token: string, violationId: string, payload: UpdateComplianceViolationDto) {
    return this.complianceViolationsClient.updateViolation(token, violationId, payload);
  }
}

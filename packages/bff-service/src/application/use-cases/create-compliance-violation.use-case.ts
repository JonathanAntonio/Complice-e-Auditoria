import type { IComplianceViolationsClient } from "../ports/compliance-violations-client.port";
import type { CreateComplianceViolationDto } from "../dtos/create-compliance-violation.dto";

export class CreateComplianceViolationUseCase {
  constructor(private readonly complianceViolationsClient: IComplianceViolationsClient) {}

  async execute(token: string, payload: CreateComplianceViolationDto) {
    return this.complianceViolationsClient.createViolation(token, payload);
  }
}

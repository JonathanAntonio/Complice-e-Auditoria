import type { IComplianceViolationsClient } from "../ports/compliance-violations-client.port";

export class ListComplianceViolationsUseCase {
  constructor(private readonly complianceViolationsClient: IComplianceViolationsClient) {}

  async execute(token: string) {
    return this.complianceViolationsClient.listViolations(token);
  }
}

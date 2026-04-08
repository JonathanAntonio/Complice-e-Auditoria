import type { CreateComplianceViolationDto } from "../dtos/create-compliance-violation.dto";
import type { UpdateComplianceViolationDto } from "../dtos/update-compliance-violation.dto";
import type { ComplianceViolationResponseDto } from "../dtos/compliance-item-response.dto";

export interface IComplianceViolationsClient {
  listViolations(token: string): Promise<ComplianceViolationResponseDto[]>;
  createViolation(
    token: string,
    payload: CreateComplianceViolationDto
  ): Promise<ComplianceViolationResponseDto>;
  updateViolation(
    token: string,
    violationId: string,
    payload: UpdateComplianceViolationDto
  ): Promise<ComplianceViolationResponseDto>;
}

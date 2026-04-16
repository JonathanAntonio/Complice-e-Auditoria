import type { CreateComplianceViolationDto } from "../dtos/create-compliance-violation.dto";
import type { UpdateComplianceViolationDto } from "../dtos/update-compliance-violation.dto";
import type { ComplianceViolationResponseDto } from "../dtos/compliance-item-response.dto";
import type { RetentionRunListDto, RetentionRunsQueryDto } from "../dtos/retention-run.dto";

export interface IComplianceViolationsClient {
  listViolations(token: string): Promise<ComplianceViolationResponseDto[]>;
  listRetentionRuns(token: string, query: RetentionRunsQueryDto): Promise<RetentionRunListDto>;
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

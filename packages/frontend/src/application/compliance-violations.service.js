import { requestBffCompliance } from "../infrastructure/http/bff-compliance.api";
import {
  parseComplianceItemsDto,
  parseCreateComplianceInputDto,
  parseUpdateComplianceInputDto,
  parseComplianceItemDto,
} from "./dtos/compliance-violation.dto";

export async function listComplianceViolations() {
  const payload = await requestBffCompliance("/violations", {
    defaultErrorMessage: "Falha ao carregar violações de compliance.",
  });

  return parseComplianceItemsDto(payload);
}

export async function createComplianceViolation(input) {
  const dto = parseCreateComplianceInputDto(input);
  const payload = await requestBffCompliance("/violations", {
    method: "POST",
    body: dto,
    defaultErrorMessage: "Falha ao criar violação de compliance.",
  });
  return parseComplianceItemDto(payload);
}

export async function updateComplianceViolation(violationId, input) {
  if (typeof violationId !== "string" || violationId.trim().length === 0) {
    throw new Error("ID da violação inválido.");
  }
  const dto = parseUpdateComplianceInputDto(input);
  const payload = await requestBffCompliance(`/violations/${encodeURIComponent(violationId.trim())}`, {
    method: "PATCH",
    body: dto,
    defaultErrorMessage: "Falha ao editar violação de compliance.",
  });
  return parseComplianceItemDto(payload);
}

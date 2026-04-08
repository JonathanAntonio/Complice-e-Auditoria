export interface ComplianceViolationResponseDto {
  id: string;
  title: string;
  severity: "baixa" | "media" | "alta";
  status: "aberta";
  createdAt: string;
}

export function parseComplianceViolationResponseDto(raw: unknown): ComplianceViolationResponseDto {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid compliance violation response");
  }

  const payload = raw as Record<string, unknown>;
  if (
    typeof payload.id !== "string" ||
    typeof payload.title !== "string" ||
    typeof payload.severity !== "string" ||
    typeof payload.status !== "string" ||
    typeof payload.createdAt !== "string"
  ) {
    throw new Error("Invalid compliance violation response");
  }

  return {
    id: payload.id,
    title: payload.title,
    severity: payload.severity as ComplianceViolationResponseDto["severity"],
    status: "aberta",
    createdAt: payload.createdAt,
  };
}

export function parseComplianceViolationListResponseDto(raw: unknown): ComplianceViolationResponseDto[] {
  if (!Array.isArray(raw)) {
    throw new Error("Invalid compliance violations response");
  }

  return raw.map((item) => parseComplianceViolationResponseDto(item));
}

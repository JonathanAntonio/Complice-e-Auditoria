const ALLOWED_SEVERITIES = ["baixa", "media", "alta"] as const;
const ALLOWED_STATUSES = ["aberta", "em_analise", "resolvida", "dispensada"] as const;

export interface UpdateComplianceViolationDto {
  title?: string;
  severity?: "baixa" | "media" | "alta";
  status?: "aberta" | "em_analise" | "resolvida" | "dispensada";
}

export function parseUpdateComplianceViolationDto(raw: unknown): UpdateComplianceViolationDto | null {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as { title?: unknown; severity?: unknown; status?: unknown };

  let title: string | undefined;
  if (payload.title !== undefined) {
    if (typeof payload.title !== "string") return null;
    title = payload.title.trim();
    if (title.length < 3 || title.length > 120) return null;
  }

  let severity: UpdateComplianceViolationDto["severity"];
  if (payload.severity !== undefined) {
    if (typeof payload.severity !== "string") return null;
    const normalizedSeverity = payload.severity.trim().toLowerCase();
    if (!ALLOWED_SEVERITIES.includes(normalizedSeverity as (typeof ALLOWED_SEVERITIES)[number])) return null;
    severity = normalizedSeverity as UpdateComplianceViolationDto["severity"];
  }

  let status: UpdateComplianceViolationDto["status"];
  if (payload.status !== undefined) {
    if (typeof payload.status !== "string") return null;
    const normalizedStatus = payload.status.trim().toLowerCase();
    if (!ALLOWED_STATUSES.includes(normalizedStatus as (typeof ALLOWED_STATUSES)[number])) return null;
    status = normalizedStatus as UpdateComplianceViolationDto["status"];
  }

  if (title === undefined && severity === undefined && status === undefined) {
    return null;
  }

  return {
    title,
    severity,
    status,
  };
}

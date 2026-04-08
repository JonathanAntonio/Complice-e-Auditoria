const ALLOWED_SEVERITIES = ["baixa", "media", "alta"] as const;

export interface UpdateComplianceViolationDto {
  title: string;
  severity: "baixa" | "media" | "alta";
}

export function parseUpdateComplianceViolationDto(raw: unknown): UpdateComplianceViolationDto | null {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as { title?: unknown; severity?: unknown };

  if (typeof payload.title !== "string") return null;
  const title = payload.title.trim();
  if (title.length < 3 || title.length > 120) return null;

  const severity = typeof payload.severity === "string"
    ? payload.severity.trim().toLowerCase()
    : "media";
  if (!ALLOWED_SEVERITIES.includes(severity as (typeof ALLOWED_SEVERITIES)[number])) return null;

  return {
    title,
    severity: severity as UpdateComplianceViolationDto["severity"],
  };
}

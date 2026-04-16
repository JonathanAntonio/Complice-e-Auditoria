export interface CreateReportExportDto {
  format: "csv" | "pdf";
  scope: "violations" | "audit" | "risk";
  requestedBy?: string;
  filters?: Record<string, unknown>;
}

export interface ReportExportJobDto {
  id: string;
  format: "csv" | "pdf";
  scope: "violations" | "audit" | "risk";
  requestedBy: string;
  status: "queued" | "completed";
  createdAtUTC: string;
  completedAtUTC?: string;
}

export interface ReportDownloadDto {
  contentType: string;
  contentDisposition: string;
  body: string;
}

export function parseCreateReportExportDto(raw: unknown): CreateReportExportDto | null {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as Record<string, unknown>;
  const format = typeof payload.format === "string" ? payload.format.trim().toLowerCase() : "";
  const scope = typeof payload.scope === "string" ? payload.scope.trim().toLowerCase() : "";
  if ((format !== "csv" && format !== "pdf") || (scope !== "violations" && scope !== "audit" && scope !== "risk")) {
    return null;
  }

  const dto: CreateReportExportDto = {
    format,
    scope,
  };

  if (typeof payload.requestedBy === "string" && payload.requestedBy.trim()) {
    dto.requestedBy = payload.requestedBy.trim();
  }
  if (payload.filters && typeof payload.filters === "object" && !Array.isArray(payload.filters)) {
    dto.filters = payload.filters as Record<string, unknown>;
  }

  return dto;
}

export function parseReportExportJobDto(raw: unknown): ReportExportJobDto {
  if (!raw || typeof raw !== "object") throw new Error("Invalid report export response");
  const payload = raw as Record<string, unknown>;
  if (
    typeof payload.id !== "string" ||
    typeof payload.format !== "string" ||
    typeof payload.scope !== "string" ||
    typeof payload.requestedBy !== "string" ||
    typeof payload.status !== "string" ||
    typeof payload.createdAtUTC !== "string"
  ) {
    throw new Error("Invalid report export response");
  }

  return {
    id: payload.id,
    format: payload.format as ReportExportJobDto["format"],
    scope: payload.scope as ReportExportJobDto["scope"],
    requestedBy: payload.requestedBy,
    status: payload.status as ReportExportJobDto["status"],
    createdAtUTC: payload.createdAtUTC,
    completedAtUTC: typeof payload.completedAtUTC === "string" ? payload.completedAtUTC : undefined,
  };
}

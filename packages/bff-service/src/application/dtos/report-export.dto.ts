export interface CreateReportExportDto {
  format: "csv" | "pdf";
  scope: "violations" | "audit" | "risk";
  requestedBy?: string;
  filters?: Record<string, unknown>;
}

export interface ReportKpisQueryDto {
  period?: "24h" | "7d" | "30d";
  area?: string;
  eventType?: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
  violationStatus?: "aberta" | "em_analise" | "resolvida" | "dispensada";
}

export interface ReportKpisDto {
  generatedAtUTC: string;
  sourceLagSeconds: number;
  appliedFilters: ReportKpisQueryDto;
  totals: {
    validatedEvents: number;
    compliantEvents: number;
    nonCompliantEvents: number;
  };
  complianceIndexPercentage: number;
  violationsByStatus: Record<"aberta" | "em_analise" | "resolvida" | "dispensada", number>;
  riskDistribution: Record<"low" | "medium" | "high" | "critical", number>;
}

export interface ReportExportJobDto {
  id: string;
  format: "csv" | "pdf";
  scope: "violations" | "audit" | "risk";
  requestedBy: string;
  status: "queued" | "completed";
  createdAtUTC: string;
  completedAtUTC?: string;
  filters?: Record<string, unknown>;
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

export function parseReportKpisQueryDto(raw: unknown): ReportKpisQueryDto {
  if (!raw || typeof raw !== "object") return {};
  const source = raw as Record<string, unknown>;
  const dto: ReportKpisQueryDto = {};
  if (source.period === "24h" || source.period === "7d" || source.period === "30d") dto.period = source.period;
  if (typeof source.area === "string" && source.area.trim()) dto.area = source.area.trim();
  if (typeof source.eventType === "string" && source.eventType.trim()) dto.eventType = source.eventType.trim();
  if (source.riskLevel === "low" || source.riskLevel === "medium" || source.riskLevel === "high" || source.riskLevel === "critical") {
    dto.riskLevel = source.riskLevel;
  }
  if (
    source.violationStatus === "aberta" ||
    source.violationStatus === "em_analise" ||
    source.violationStatus === "resolvida" ||
    source.violationStatus === "dispensada"
  ) {
    dto.violationStatus = source.violationStatus;
  }
  return dto;
}

export function parseReportKpisDto(raw: unknown): ReportKpisDto {
  if (!raw || typeof raw !== "object") throw new Error("Invalid KPI response");
  const payload = raw as Record<string, unknown>;
  const totals = payload.totals as Record<string, unknown> | undefined;
  const violationsByStatus = payload.violationsByStatus as Record<string, unknown> | undefined;
  const riskDistribution = payload.riskDistribution as Record<string, unknown> | undefined;
  if (
    typeof payload.generatedAtUTC !== "string" ||
    typeof payload.sourceLagSeconds !== "number" ||
    typeof payload.complianceIndexPercentage !== "number" ||
    !totals ||
    !violationsByStatus ||
    !riskDistribution
  ) {
    throw new Error("Invalid KPI response");
  }
  return {
    generatedAtUTC: payload.generatedAtUTC,
    sourceLagSeconds: payload.sourceLagSeconds,
    appliedFilters: parseReportKpisQueryDto((payload.appliedFilters ?? {}) as Record<string, unknown>),
    totals: {
      validatedEvents: Number(totals.validatedEvents ?? 0),
      compliantEvents: Number(totals.compliantEvents ?? 0),
      nonCompliantEvents: Number(totals.nonCompliantEvents ?? 0),
    },
    complianceIndexPercentage: payload.complianceIndexPercentage,
    violationsByStatus: {
      aberta: Number(violationsByStatus.aberta ?? 0),
      em_analise: Number(violationsByStatus.em_analise ?? 0),
      resolvida: Number(violationsByStatus.resolvida ?? 0),
      dispensada: Number(violationsByStatus.dispensada ?? 0),
    },
    riskDistribution: {
      low: Number(riskDistribution.low ?? 0),
      medium: Number(riskDistribution.medium ?? 0),
      high: Number(riskDistribution.high ?? 0),
      critical: Number(riskDistribution.critical ?? 0),
    },
  };
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
    filters: payload.filters && typeof payload.filters === "object" && !Array.isArray(payload.filters)
      ? (payload.filters as Record<string, unknown>)
      : undefined,
  };
}

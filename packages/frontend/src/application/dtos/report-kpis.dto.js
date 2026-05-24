const ALLOWED_PERIODS = new Set(["24h", "7d", "30d"]);
const ALLOWED_RISK_LEVELS = new Set(["low", "medium", "high", "critical"]);
const ALLOWED_VIOLATION_STATUSES = new Set(["aberta", "resolvida", "dispensada"]);

function normalizeOptionalString(value) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function parseReportKpisQueryDto(raw) {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const input = raw;
  const dto = {};

  const period = normalizeOptionalString(input.period);
  if (period !== undefined) {
    const normalized = period.toLowerCase();
    if (!ALLOWED_PERIODS.has(normalized)) {
      throw new Error("Período inválido para KPIs.");
    }
    dto.period = normalized;
  }

  const area = normalizeOptionalString(input.area);
  if (area !== undefined) {
    dto.area = area;
  }

  const eventType = normalizeOptionalString(input.eventType);
  if (eventType !== undefined) {
    dto.eventType = eventType;
  }

  const riskLevel = normalizeOptionalString(input.riskLevel);
  if (riskLevel !== undefined) {
    const normalized = riskLevel.toLowerCase();
    if (!ALLOWED_RISK_LEVELS.has(normalized)) {
      throw new Error("Nível de risco inválido para KPIs.");
    }
    dto.riskLevel = normalized;
  }

  const violationStatus = normalizeOptionalString(input.violationStatus);
  if (violationStatus !== undefined) {
    const normalized = violationStatus.toLowerCase();
    if (!ALLOWED_VIOLATION_STATUSES.has(normalized)) {
      throw new Error("Status de violação inválido para KPIs.");
    }
    dto.violationStatus = normalized;
  }

  return dto;
}

export function parseReportKpisDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta inválida para KPIs.");
  }

  const payload = raw;
  if (
    typeof payload.period !== "string" ||
    typeof payload.generatedAtUTC !== "string" ||
    typeof payload.filters !== "object" ||
    payload.filters === null ||
    typeof payload.totals !== "object" ||
    payload.totals === null ||
    typeof payload.lag !== "object" ||
    payload.lag === null
  ) {
    throw new Error("Resposta inválida para KPIs.");
  }

  const totals = payload.totals;
  const lag = payload.lag;

  const numberFields = [
    totals.events,
    totals.violationsOpen,
    totals.violationsResolved,
    totals.violationsDismissed,
    totals.riskHigh,
    totals.riskCritical,
    totals.notificationsFailed,
    lag.auditLagSeconds,
    lag.riskLagSeconds,
    lag.notificationLagSeconds,
  ];

  if (numberFields.some((value) => typeof value !== "number" || !Number.isFinite(value))) {
    throw new Error("Resposta inválida para KPIs.");
  }

  return {
    period: payload.period,
    generatedAtUTC: payload.generatedAtUTC,
    filters: {
      area: normalizeOptionalString(payload.filters.area) ?? null,
      eventType: normalizeOptionalString(payload.filters.eventType) ?? null,
      riskLevel: normalizeOptionalString(payload.filters.riskLevel) ?? null,
      violationStatus: normalizeOptionalString(payload.filters.violationStatus) ?? null,
    },
    totals: {
      events: totals.events,
      violationsOpen: totals.violationsOpen,
      violationsResolved: totals.violationsResolved,
      violationsDismissed: totals.violationsDismissed,
      riskHigh: totals.riskHigh,
      riskCritical: totals.riskCritical,
      notificationsFailed: totals.notificationsFailed,
    },
    lag: {
      auditLagSeconds: lag.auditLagSeconds,
      riskLagSeconds: lag.riskLagSeconds,
      notificationLagSeconds: lag.notificationLagSeconds,
    },
  };
}

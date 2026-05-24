export const REPORTING_URL_STATE_SCHEMA = {
  format: { key: "format", defaultValue: "csv", omitIfDefault: false },
  scope: { key: "scope", defaultValue: "violations", omitIfDefault: false },
  period: { key: "period", defaultValue: "7d", omitIfDefault: false },
  area: { key: "area", defaultValue: "" },
  eventType: { key: "eventType", defaultValue: "" },
  riskLevel: { key: "riskLevel", defaultValue: "" },
  violationStatus: { key: "violationStatus", defaultValue: "" },
};

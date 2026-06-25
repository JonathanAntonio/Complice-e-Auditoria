export const AUDIT_FILTER_URL_SCHEMA = {
  type: { key: "type", defaultValue: "" },
  actorId: { key: "actorId", defaultValue: "" },
  severity: { key: "severity", defaultValue: "" },
  page: { key: "page", defaultValue: 1, parse: (v) => Number(v) || 1, serialize: (v) => String(v) },
  pageSize: { key: "pageSize", defaultValue: 20, parse: (v) => Number(v) || 20, serialize: (v) => String(v) },
};

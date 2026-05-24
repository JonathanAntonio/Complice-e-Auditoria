function normalizeRetentionStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "all";
  if (["all", "todos"].includes(normalized)) return "all";
  if (["running", "executando"].includes(normalized)) return "running";
  if (["success", "sucesso"].includes(normalized)) return "success";
  if (["failed", "falha"].includes(normalized)) return "failed";
  return "all";
}

export const RETENTION_FILTER_URL_SCHEMA = {
  auditStatus: {
    key: "auditStatus",
    defaultValue: "all",
    parse: normalizeRetentionStatus,
    serialize: normalizeRetentionStatus,
  },
  complianceStatus: {
    key: "complianceStatus",
    defaultValue: "all",
    parse: normalizeRetentionStatus,
    serialize: normalizeRetentionStatus,
  },
};

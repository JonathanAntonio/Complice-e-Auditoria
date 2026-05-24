export const DEFAULT_MESSAGING_FILTERS = {
  sourceService: undefined,
  eventType: "",
  correlationId: "",
  notificationStatus: undefined,
  onlyFailures: false,
  auditLimit: 100,
  failuresLimit: 40,
};

export const MESSAGING_URL_STATE_SCHEMA = {
  sourceService: { key: "sourceService", defaultValue: undefined },
  eventType: { key: "eventType", defaultValue: "" },
  correlationId: { key: "correlationId", defaultValue: "" },
  notificationStatus: { key: "notificationStatus", defaultValue: undefined },
  onlyFailures: {
    key: "onlyFailures",
    defaultValue: false,
    parse: (value) => value === "true",
    serialize: (value) => (value ? "true" : ""),
  },
  auditLimit: {
    key: "auditLimit",
    defaultValue: DEFAULT_MESSAGING_FILTERS.auditLimit,
    parse: (value) => Number(value),
  },
  failuresLimit: {
    key: "failuresLimit",
    defaultValue: DEFAULT_MESSAGING_FILTERS.failuresLimit,
    parse: (value) => Number(value),
  },
};

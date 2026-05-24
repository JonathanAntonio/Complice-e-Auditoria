export const ADMIN_LIST_URL_STATE_SCHEMA = {
  page: { key: "page", defaultValue: 1, parse: (value) => Number(value) || 1, serialize: (value) => String(value) },
  pageSize: { key: "pageSize", defaultValue: 10, parse: (value) => Number(value) || 10, serialize: (value) => String(value) },
  query: { key: "q", defaultValue: "" },
};

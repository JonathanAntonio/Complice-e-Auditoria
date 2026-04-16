export interface ListUsersQueryDto {
  page: number;
  pageSize: number;
  search?: string;
}

export function parseListUsersQuery(input: unknown): ListUsersQueryDto {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const page = toPositiveInt(source.page, 1);
  const pageSize = Math.min(100, toPositiveInt(source.pageSize, 20));
  const search = typeof source.search === "string" && source.search.trim().length > 0
    ? source.search.trim()
    : undefined;

  return {
    page,
    pageSize,
    ...(search ? { search } : {}),
  };
}

function toPositiveInt(raw: unknown, fallback: number): number {
  if (typeof raw === "number" && Number.isInteger(raw) && raw > 0) return raw;
  if (typeof raw === "string" && raw.trim().length > 0) {
    const parsed = Number.parseInt(raw.trim(), 10);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

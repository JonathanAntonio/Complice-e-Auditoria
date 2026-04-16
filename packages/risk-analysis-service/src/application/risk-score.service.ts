import { z } from "zod";

const riskEventSchema = z.object({
  userId: z.string().trim().min(1),
  area: z.string().trim().min(1),
  processType: z.string().trim().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
});

export type RiskEventInput = z.infer<typeof riskEventSchema>;

export interface RiskScore {
  entityType: "user" | "area" | "process";
  entityId: string;
  score: number;
  level: "low" | "medium" | "high" | "critical";
  updatedAtUTC: string;
}

export interface RiskScoresQuery {
  entityType?: "user" | "area" | "process";
  level?: "low" | "medium" | "high" | "critical";
  search?: string;
  minScore?: number;
  maxScore?: number;
  page?: number;
  pageSize?: number;
  sortBy?: "score" | "updatedAtUTC" | "level";
  sortDir?: "asc" | "desc";
}

export interface RiskScoresSummary {
  lowCount: number;
  mediumCount: number;
  highCount: number;
  criticalCount: number;
}

export interface RiskScoresListResult {
  items: RiskScore[];
  summary: RiskScoresSummary;
  total: number;
  page: number;
  pageSize: number;
  generatedAtUTC: string;
}

export interface RiskHistoryPoint {
  bucketUTC: string;
  score: number;
  level: "low" | "medium" | "high" | "critical";
}

export interface RiskScoreHistoryResult {
  entityType: "user" | "area" | "process";
  entityId: string;
  fromUTC: string;
  toUTC: string;
  bucket: "hour" | "day";
  points: RiskHistoryPoint[];
  delta: number;
}

function toWeight(severity: RiskEventInput["severity"]): number {
  if (severity === "critical") return 30;
  if (severity === "high") return 20;
  if (severity === "medium") return 10;
  return 4;
}

function toLevel(score: number): RiskScore["level"] {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

function clamp(score: number): number {
  return Math.max(0, Math.min(100, score));
}

export class RiskScoreService {
  private readonly userScores = new Map<string, number>();
  private readonly areaScores = new Map<string, number>();
  private readonly processScores = new Map<string, number>();
  private readonly lastUpdated = new Map<string, string>();
  private readonly history = new Map<string, Array<{ atUTC: string; score: number }>>();

  ingest(raw: unknown): { accepted: true; updatedAtUTC: string } {
    const event = riskEventSchema.parse(raw);
    const weight = toWeight(event.severity);

    this.bump(this.userScores, `user:${event.userId}`, weight);
    this.bump(this.areaScores, `area:${event.area}`, weight);
    this.bump(this.processScores, `process:${event.processType}`, weight);

    const updatedAtUTC = new Date().toISOString();
    this.recordUpdate("user", event.userId, updatedAtUTC);
    this.recordUpdate("area", event.area, updatedAtUTC);
    this.recordUpdate("process", event.processType, updatedAtUTC);

    return { accepted: true, updatedAtUTC };
  }

  list(query: RiskScoresQuery = {}): RiskScoresListResult {
    const all =
      query.entityType === "user"
        ? this.toScores("user", this.userScores)
        : query.entityType === "area"
          ? this.toScores("area", this.areaScores)
          : query.entityType === "process"
            ? this.toScores("process", this.processScores)
            : [
      ...this.toScores("user", this.userScores),
      ...this.toScores("area", this.areaScores),
      ...this.toScores("process", this.processScores),
    ];

    const search = query.search?.trim().toLowerCase();
    const minScore = Number.isFinite(query.minScore) ? Math.max(0, Math.min(100, Math.round(query.minScore as number))) : undefined;
    const maxScore = Number.isFinite(query.maxScore) ? Math.max(0, Math.min(100, Math.round(query.maxScore as number))) : undefined;

    const filtered = all.filter((item) => {
      if (query.level && item.level !== query.level) return false;
      if (search && !item.entityId.toLowerCase().includes(search)) return false;
      if (minScore !== undefined && item.score < minScore) return false;
      if (maxScore !== undefined && item.score > maxScore) return false;
      return true;
    });

    const summary = summarize(filtered);
    const sorted = [...filtered].sort((left, right) => {
      const dir = query.sortDir === "asc" ? 1 : -1;
      const sortBy = query.sortBy ?? "score";

      if (sortBy === "updatedAtUTC") {
        return left.updatedAtUTC.localeCompare(right.updatedAtUTC) * dir;
      }
      if (sortBy === "level") {
        return (levelRank(left.level) - levelRank(right.level)) * dir;
      }
      return (left.score - right.score) * dir;
    });

    const page = Number.isInteger(query.page) && (query.page as number) > 0 ? (query.page as number) : 1;
    const pageSize = Number.isInteger(query.pageSize) && (query.pageSize as number) > 0
      ? Math.min(100, query.pageSize as number)
      : 20;
    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize);

    return {
      items,
      summary,
      total: sorted.length,
      page,
      pageSize,
      generatedAtUTC: new Date().toISOString(),
    };
  }

  historyFor(
    entityType: "user" | "area" | "process",
    entityId: string,
    fromUTC?: string,
    toUTC?: string,
    bucket: "hour" | "day" = "hour"
  ): RiskScoreHistoryResult {
    const key = `${entityType}:${entityId}`;
    const raw = this.history.get(key) ?? [];
    const from = fromUTC ? new Date(fromUTC) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const to = toUTC ? new Date(toUTC) : new Date();
    const fromTime = Number.isNaN(from.getTime()) ? Date.now() - 24 * 60 * 60 * 1000 : from.getTime();
    const toTime = Number.isNaN(to.getTime()) ? Date.now() : to.getTime();

    const filtered = raw.filter((entry) => {
      const atTime = new Date(entry.atUTC).getTime();
      return atTime >= fromTime && atTime <= toTime;
    });

    const buckets = new Map<string, number>();
    for (const entry of filtered) {
      const label = normalizeBucket(entry.atUTC, bucket);
      buckets.set(label, entry.score);
    }

    const points = [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([bucketUTC, score]) => ({
        bucketUTC,
        score,
        level: toLevel(score),
      }));

    const first = points[0]?.score ?? 0;
    const last = points[points.length - 1]?.score ?? 0;
    return {
      entityType,
      entityId,
      fromUTC: new Date(fromTime).toISOString(),
      toUTC: new Date(toTime).toISOString(),
      bucket,
      points,
      delta: last - first,
    };
  }

  private bump(map: Map<string, number>, key: string, weight: number): void {
    const current = map.get(key) ?? 0;
    map.set(key, clamp(current + weight));
  }

  private toScores(entityType: "user" | "area" | "process", map: Map<string, number>): RiskScore[] {
    return [...map.entries()].map(([rawId, score]) => {
      const entityId = rawId.split(":").slice(1).join(":");
      const updatedAtUTC = this.lastUpdated.get(rawId) ?? new Date().toISOString();
      return {
        entityType,
        entityId,
        score,
        level: toLevel(score),
        updatedAtUTC,
      };
    });
  }

  private recordUpdate(entityType: "user" | "area" | "process", entityId: string, atUTC: string): void {
    const key = `${entityType}:${entityId}`;
    this.lastUpdated.set(key, atUTC);

    const map = entityType === "user" ? this.userScores : entityType === "area" ? this.areaScores : this.processScores;
    const nextScore = map.get(key) ?? 0;
    const row = this.history.get(key) ?? [];
    row.push({ atUTC, score: nextScore });
    this.history.set(key, row.slice(-500));
  }
}

function summarize(items: RiskScore[]): RiskScoresSummary {
  const summary: RiskScoresSummary = { lowCount: 0, mediumCount: 0, highCount: 0, criticalCount: 0 };
  for (const item of items) {
    if (item.level === "critical") summary.criticalCount += 1;
    else if (item.level === "high") summary.highCount += 1;
    else if (item.level === "medium") summary.mediumCount += 1;
    else summary.lowCount += 1;
  }
  return summary;
}

function normalizeBucket(atUTC: string, bucket: "hour" | "day"): string {
  const date = new Date(atUTC);
  if (Number.isNaN(date.getTime())) return atUTC;
  if (bucket === "day") {
    date.setUTCHours(0, 0, 0, 0);
  } else {
    date.setUTCMinutes(0, 0, 0);
  }
  return date.toISOString();
}

function levelRank(level: "low" | "medium" | "high" | "critical"): number {
  if (level === "critical") return 4;
  if (level === "high") return 3;
  if (level === "medium") return 2;
  return 1;
}

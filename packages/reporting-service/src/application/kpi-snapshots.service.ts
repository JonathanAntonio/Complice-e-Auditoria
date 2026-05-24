import { z } from "zod";

const kpiQuerySchema = z.object({
  period: z.enum(["24h", "7d", "30d"]).optional().default("24h"),
  area: z.string().trim().min(1).optional(),
  eventType: z.string().trim().min(1).optional(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
  violationStatus: z.enum(["aberta", "em_analise", "resolvida", "dispensada"]).optional(),
});

type KpiQuery = z.infer<typeof kpiQuerySchema>;

interface KpiEvent {
  area: string;
  eventType: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  violationStatus: "aberta" | "em_analise" | "resolvida" | "dispensada";
  isCompliant: boolean;
  occurredAtOffsetSeconds: number;
}

export interface KpiSnapshot {
  generatedAtUTC: string;
  sourceLagSeconds: number;
  appliedFilters: KpiQuery;
  totals: {
    validatedEvents: number;
    compliantEvents: number;
    nonCompliantEvents: number;
  };
  complianceIndexPercentage: number;
  violationsByStatus: Record<"aberta" | "em_analise" | "resolvida" | "dispensada", number>;
  riskDistribution: Record<"low" | "medium" | "high" | "critical", number>;
}

const baseEvents: KpiEvent[] = [
  { area: "finance", eventType: "invoice_created", riskLevel: "medium", violationStatus: "resolvida", isCompliant: true, occurredAtOffsetSeconds: 10 },
  { area: "finance", eventType: "invoice_updated", riskLevel: "high", violationStatus: "aberta", isCompliant: false, occurredAtOffsetSeconds: 15 },
  { area: "hr", eventType: "employee_updated", riskLevel: "low", violationStatus: "dispensada", isCompliant: true, occurredAtOffsetSeconds: 20 },
  { area: "ops", eventType: "access_granted", riskLevel: "critical", violationStatus: "em_analise", isCompliant: false, occurredAtOffsetSeconds: 30 },
  { area: "ops", eventType: "access_revoked", riskLevel: "medium", violationStatus: "resolvida", isCompliant: true, occurredAtOffsetSeconds: 40 },
];

export class KpiSnapshotsService {
  constructor(private readonly now: () => Date = () => new Date()) {}

  getSnapshot(raw: unknown): KpiSnapshot {
    const query = kpiQuerySchema.parse(raw ?? {});
    const now = this.now();
    const periodSeconds = query.period === "7d" ? 7 * 24 * 60 * 60 : query.period === "30d" ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

    const events = baseEvents.filter((event) => {
      if (event.occurredAtOffsetSeconds > periodSeconds) return false;
      if (query.area && event.area !== query.area) return false;
      if (query.eventType && event.eventType !== query.eventType) return false;
      if (query.riskLevel && event.riskLevel !== query.riskLevel) return false;
      if (query.violationStatus && event.violationStatus !== query.violationStatus) return false;
      return true;
    });

    const validatedEvents = events.length;
    const compliantEvents = events.filter((event) => event.isCompliant).length;
    const nonCompliantEvents = validatedEvents - compliantEvents;
    const complianceIndexPercentage = validatedEvents === 0
      ? 100
      : round2((compliantEvents / validatedEvents) * 100);

    const sourceLagSeconds = events.length > 0
      ? Math.max(...events.map((event) => event.occurredAtOffsetSeconds))
      : 0;

    return {
      generatedAtUTC: now.toISOString(),
      sourceLagSeconds,
      appliedFilters: query,
      totals: {
        validatedEvents,
        compliantEvents,
        nonCompliantEvents,
      },
      complianceIndexPercentage,
      violationsByStatus: {
        aberta: events.filter((event) => event.violationStatus === "aberta").length,
        em_analise: events.filter((event) => event.violationStatus === "em_analise").length,
        resolvida: events.filter((event) => event.violationStatus === "resolvida").length,
        dispensada: events.filter((event) => event.violationStatus === "dispensada").length,
      },
      riskDistribution: {
        low: events.filter((event) => event.riskLevel === "low").length,
        medium: events.filter((event) => event.riskLevel === "medium").length,
        high: events.filter((event) => event.riskLevel === "high").length,
        critical: events.filter((event) => event.riskLevel === "critical").length,
      },
    };
  }
}

function round2(input: number): number {
  return Math.round(input * 100) / 100;
}

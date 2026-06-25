import { randomUUID } from "crypto";
import { z } from "zod";
import { generatePdfReport } from "./pdf-generator";
import { baseEvents } from "./kpi-snapshots.service";

const createExportSchema = z.object({
  format: z.enum(["csv", "pdf"]),
  scope: z.enum(["violations", "audit", "risk"]),
  requestedBy: z.string().trim().min(1).default("system"),
  filters: z.record(z.unknown()).optional(),
});

export type CreateExportInput = z.infer<typeof createExportSchema>;

export interface ExportJob {
  id: string;
  format: "csv" | "pdf";
  scope: "violations" | "audit" | "risk";
  requestedBy: string;
  status: "queued" | "completed";
  createdAtUTC: string;
  completedAtUTC?: string;
  filters?: Record<string, unknown>;
}

export class ExportJobsService {
  private readonly jobs = new Map<string, ExportJob>();

  create(raw: unknown): ExportJob {
    const parsed = createExportSchema.parse(raw);
    const id = randomUUID();
    const createdAtUTC = new Date().toISOString();
    const completedAtUTC = new Date(Date.now() + 500).toISOString();

    const job: ExportJob = {
      id,
      format: parsed.format,
      scope: parsed.scope,
      requestedBy: parsed.requestedBy,
      status: "completed",
      createdAtUTC,
      completedAtUTC,
      filters: parsed.filters,
    };

    this.jobs.set(id, job);
    return job;
  }

  getById(id: string): ExportJob | null {
    return this.jobs.get(id) ?? null;
  }

  renderContent(job: ExportJob): { mimeType: string; filename: string; content: string } {
    const now = new Date().toISOString();
    const period = typeof job.filters?.period === "string" ? job.filters.period : "24h";
    const periodSeconds = period === "7d" ? 7 * 24 * 60 * 60 : period === "30d" ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

    let filteredEvents = baseEvents.filter((event) => {
      if (event.occurredAtOffsetSeconds > periodSeconds) return false;

      const filters = job.filters || {};
      if (typeof filters.area === "string" && event.area !== filters.area) return false;
      if (typeof filters.eventType === "string" && event.eventType !== filters.eventType) return false;
      if (typeof filters.riskLevel === "string" && event.riskLevel !== filters.riskLevel) return false;
      if (typeof filters.violationStatus === "string" && event.violationStatus !== filters.violationStatus) return false;

      return true;
    });

    if (job.scope === "violations") {
      filteredEvents = filteredEvents.filter((event) => !event.isCompliant);
    }

    if (job.format === "csv") {
      const headers = ["generated_at_utc", "area", "event_type", "risk_level", "violation_status", "is_compliant"];
      const rows = filteredEvents.map((e) =>
        `${now},${e.area},${e.eventType},${e.riskLevel},${e.violationStatus},${e.isCompliant}`
      );

      return {
        mimeType: "text/csv; charset=utf-8",
        filename: `report-${job.scope}-${job.id}.csv`,
        content: [headers.join(","), ...rows].join("\n"),
      };
    }

    const pdfText = generatePdfReport(job.id, now, job.requestedBy, job.scope, period, filteredEvents);

    return {
      mimeType: "application/pdf",
      filename: `report-${job.scope}-${job.id}.pdf`,
      content: pdfText,
    };
  }
}

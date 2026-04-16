import { randomUUID } from "crypto";
import { z } from "zod";

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
    const period = typeof job.filters?.period === "string" ? job.filters.period : "n/a";

    if (job.format === "csv") {
      return {
        mimeType: "text/csv; charset=utf-8",
        filename: `report-${job.scope}-${job.id}.csv`,
        content: [
          "generated_at_utc,requested_by,scope,period,status",
          `${now},${job.requestedBy},${job.scope},${period},${job.status}`,
        ].join("\n"),
      };
    }

    return {
      mimeType: "application/pdf",
      filename: `report-${job.scope}-${job.id}.pdf`,
      content: `PDF_PLACEHOLDER\nGeneratedAtUTC=${now}\nRequestedBy=${job.requestedBy}\nScope=${job.scope}\nPeriod=${period}`,
    };
  }
}

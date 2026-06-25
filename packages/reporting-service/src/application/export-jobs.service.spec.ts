import { describe, expect, it } from "vitest";
import { ExportJobsService } from "./export-jobs.service";

describe("ExportJobsService", () => {
  it("creates and retrieves a completed export job", () => {
    const service = new ExportJobsService();
    const job = service.create({
      format: "csv",
      scope: "audit",
      requestedBy: "qa-user",
      filters: { period: "30" },
    });

    expect(job.id).toBeTruthy();
    expect(job.status).toBe("completed");
    expect(job.scope).toBe("audit");
    expect(job.completedAtUTC).toBeTruthy();

    const fetched = service.getById(job.id);
    expect(fetched).toEqual(job);
  });

  it("renders csv and pdf exports", () => {
    const service = new ExportJobsService();
    const csvJob = service.create({ format: "csv", scope: "violations", requestedBy: "ops" });
    const pdfJob = service.create({ format: "pdf", scope: "risk", requestedBy: "ops" });

    const csv = service.renderContent(csvJob);
    expect(csv.mimeType).toContain("text/csv");
    expect(csv.filename).toContain(".csv");
    expect(csv.content).toContain("generated_at_utc");

    const pdf = service.renderContent(pdfJob);
    expect(pdf.mimeType).toBe("application/pdf");
    expect(pdf.filename).toContain(".pdf");
    expect(pdf.content).toContain("COMPLIANCE & AUDIT PLATFORM");
    expect(pdf.content.startsWith("%PDF-")).toBe(true);
    expect(pdf.content.trim().endsWith("%%EOF")).toBe(true);
  });
});

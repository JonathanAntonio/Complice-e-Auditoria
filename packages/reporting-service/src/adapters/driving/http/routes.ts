import { Router, type Request, type Response } from "express";
import { sendError, sendValidationError } from "@lframework/shared";
import { z, ZodError } from "zod";
import type { ExportJobsService } from "../../../application/export-jobs.service";

const idSchema = z.string().uuid();

export function createReportingRoutes(service: ExportJobsService): Router {
  const router = Router();

  router.post("/reports/exports", (req: Request, res: Response) => {
    try {
      const job = service.create(req.body);
      res.status(201).json(job);
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      throw err;
    }
  });

  router.get("/reports/exports/:id", (req: Request, res: Response) => {
    const parsed = idSchema.safeParse(req.params.id);
    if (!parsed.success) {
      sendError(res, 400, "Invalid export id");
      return;
    }

    const job = service.getById(parsed.data);
    if (!job) {
      sendError(res, 404, "Export not found");
      return;
    }

    res.json(job);
  });

  router.get("/reports/exports/:id/download", (req: Request, res: Response) => {
    const parsed = idSchema.safeParse(req.params.id);
    if (!parsed.success) {
      sendError(res, 400, "Invalid export id");
      return;
    }

    const job = service.getById(parsed.data);
    if (!job) {
      sendError(res, 404, "Export not found");
      return;
    }

    const rendered = service.renderContent(job);
    res.setHeader("Content-Type", rendered.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${rendered.filename}"`);
    res.status(200).send(rendered.content);
  });

  return router;
}

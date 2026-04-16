import { Router, type Request, type Response } from "express";
import { sendValidationError } from "@lframework/shared";
import { z, ZodError } from "zod";
import type { RiskScoreService } from "../../../application/risk-score.service";

const querySchema = z.object({
  entityType: z.enum(["user", "area", "process"]).optional(),
  level: z.enum(["low", "medium", "high", "critical"]).optional(),
  search: z.string().trim().min(1).optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxScore: z.coerce.number().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(["score", "updatedAtUTC", "level"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

const historyQuerySchema = z.object({
  fromUTC: z.string().datetime().optional(),
  toUTC: z.string().datetime().optional(),
  bucket: z.enum(["hour", "day"]).optional(),
});

export function createRiskRoutes(service: RiskScoreService): Router {
  const router = Router();

  router.get("/risk/scores", (req: Request, res: Response) => {
    try {
      const parsed = querySchema.parse(req.query);
      res.json(service.list(parsed));
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      throw err;
    }
  });

  router.post("/risk/events", (req: Request, res: Response) => {
    try {
      const result = service.ingest(req.body);
      res.status(202).json(result);
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      throw err;
    }
  });

  router.get("/risk/scores/:entityType/:entityId/history", (req: Request, res: Response) => {
    try {
      const entityType = z.enum(["user", "area", "process"]).parse(req.params.entityType);
      const entityId = z.string().trim().min(1).parse(req.params.entityId);
      const query = historyQuerySchema.parse(req.query);
      const result = service.historyFor(entityType, entityId, query.fromUTC, query.toUTC, query.bucket);
      res.json(result);
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      throw err;
    }
  });

  return router;
}

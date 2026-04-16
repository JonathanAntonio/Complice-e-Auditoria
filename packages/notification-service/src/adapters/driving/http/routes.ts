import { Router, type Request, type Response } from "express";
import { sendValidationError } from "@lframework/shared";
import { ZodError } from "zod";
import type { NotificationDispatchService } from "../../../application/notification-dispatch.service";

export function createNotificationRoutes(service: NotificationDispatchService): Router {
  const router = Router();

  router.post("/notifications/dispatch", (req: Request, res: Response) => {
    try {
      const result = service.dispatch(req.body);
      res.status(202).json(result);
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      throw err;
    }
  });

  router.get("/notifications/logs", (_req: Request, res: Response) => {
    res.json({ items: service.list(), generatedAtUTC: new Date().toISOString() });
  });

  return router;
}

import { Router, type Request, type Response } from "express";
import { sendValidationError } from "@lframework/shared";
import { ZodError } from "zod";
import type { NotificationDispatchService } from "../../../application/notification-dispatch.service";
import type { NotificationPreferencesService } from "../../../application/notification-preferences.service";

export function createNotificationRoutes(
  service: NotificationDispatchService,
  preferencesService: NotificationPreferencesService
): Router {
  const router = Router();

  router.post("/notifications/dispatch", async (req: Request, res: Response) => {
    try {
      const logs = await service.dispatchMany(req.body);
      const primary = logs[0] ?? null;
      if (!primary) {
        res.status(202).json({ status: "skipped_by_preferences", dispatchedCount: 0 });
        return;
      }
      res.status(202).json({
        ...primary,
        dispatchedCount: logs.length,
      });
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

  router.put("/notifications/preferences/:recipient", async (req: Request, res: Response) => {
    try {
      const recipient = req.params.recipient ?? "";
      const preference = await preferencesService.upsert(recipient, req.body);
      res.status(200).json(preference);
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      throw err;
    }
  });

  router.get("/notifications/preferences/:recipient", async (req: Request, res: Response) => {
    const recipient = req.params.recipient ?? "";
    const preference = await preferencesService.get(recipient);
    if (!preference) {
      res.status(404).json({ error: "not_found", message: "Preference not found" });
      return;
    }
    res.status(200).json(preference);
  });

  return router;
}

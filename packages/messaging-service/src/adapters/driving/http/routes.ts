import { Router } from "express";
import { asyncHandler } from "@lframework/shared";
import type { MessagingFlowController } from "./messaging-flow.controller";

export function createMessagingRoutes(controller: MessagingFlowController): Router {
  const router = Router();
  router.get("/messaging/flow", asyncHandler(controller.get));
  return router;
}

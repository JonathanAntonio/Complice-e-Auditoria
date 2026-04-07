import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "@lframework/shared";
import { AuthController } from "./auth.controller";

/**
 * Logout registra evento de auditoria no servidor.
 * A invalidação antecipada de JWT ainda depende de mecanismo adicional (ex.: blacklist).
 */

const skipRateLimit = process.env.NODE_ENV === "test";

const oauthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 30, // redirects + callbacks per IP
  message: { error: "Too many OAuth attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => skipRateLimit,
});

export function createAuthRoutes(
  controller: AuthController,
  authMiddleware: (req: Request, res: Response, next: NextFunction) => void
): Router {
  const router = Router();

  router.post("/auth/logout", authMiddleware, asyncHandler(controller.logout.bind(controller)));
  router.get("/auth/me", authMiddleware, asyncHandler(controller.me.bind(controller)));

  router.get("/auth/google/url", oauthRateLimiter, asyncHandler(controller.googleAuthorizationUrl.bind(controller)));
  router.get("/auth/google/callback", oauthRateLimiter, asyncHandler(controller.googleCallback.bind(controller)));

  router.get("/auth/github/url", oauthRateLimiter, asyncHandler(controller.githubAuthorizationUrl.bind(controller)));
  router.get("/auth/github/callback", oauthRateLimiter, asyncHandler(controller.githubCallback.bind(controller)));

  return router;
}

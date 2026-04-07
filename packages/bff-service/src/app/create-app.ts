import express from "express";
import {
  correlationIdMiddleware,
  requestIdMiddleware,
  requestLoggingMiddleware,
} from "@lframework/shared";
import type { BffConfig } from "./config";
import { IamAuthHttpClient } from "../adapters/driven/http/iam-auth-http.client";
import { CookieSessionService } from "../adapters/driving/http/cookie-session.service";
import { StartOAuthUseCase } from "../application/use-cases/start-oauth.use-case";
import { CompleteOAuthCallbackUseCase } from "../application/use-cases/complete-oauth-callback.use-case";
import { GetCurrentUserUseCase } from "../application/use-cases/get-current-user.use-case";
import { LogoutUseCase } from "../application/use-cases/logout.use-case";
import { AuthHandlers } from "../adapters/driving/http/auth.handlers";

export function createApp(config: BffConfig) {
  const app = express();
  app.set("trust proxy", 1);
  app.use(requestIdMiddleware);
  app.use(correlationIdMiddleware);
  app.use(requestLoggingMiddleware);
  app.use(express.json({ limit: "128kb" }));

  const iamAuthClient = new IamAuthHttpClient({
    gatewayBaseUrl: config.gatewayBaseUrl,
    iamAuthBasePath: config.iamAuthBasePath,
  });
  const cookieSessionService = new CookieSessionService({
    sessionCookieName: config.sessionCookieName,
    sessionMaxAgeSeconds: config.sessionMaxAgeSeconds,
  });

  const handlers = new AuthHandlers({
    startOAuthUseCase: new StartOAuthUseCase(iamAuthClient),
    completeOAuthCallbackUseCase: new CompleteOAuthCallbackUseCase(iamAuthClient),
    getCurrentUserUseCase: new GetCurrentUserUseCase(iamAuthClient),
    logoutUseCase: new LogoutUseCase(iamAuthClient),
    cookieSessionService,
    explicitPublicBaseUrl: config.explicitPublicBaseUrl,
  });

  app.get("/health", handlers.health);
  app.get("/bff/auth/google/start", handlers.googleStart);
  app.get("/bff/auth/github/start", handlers.githubStart);
  app.get("/bff/auth/google/callback", handlers.googleCallback);
  app.get("/bff/auth/github/callback", handlers.githubCallback);
  app.get("/bff/auth/me", handlers.me);
  app.post("/bff/auth/logout", handlers.logout);

  return app;
}

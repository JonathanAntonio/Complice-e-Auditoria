import type { Request, Response } from "express";
import { logger } from "@lframework/shared";
import type { OAuthProvider } from "../../../domain/oauth";
import { UpstreamHttpError } from "../../../application/errors/upstream-http.error";
import { StartOAuthUseCase } from "../../../application/use-cases/start-oauth.use-case";
import { CompleteOAuthCallbackUseCase } from "../../../application/use-cases/complete-oauth-callback.use-case";
import { GetCurrentUserUseCase } from "../../../application/use-cases/get-current-user.use-case";
import { LogoutUseCase } from "../../../application/use-cases/logout.use-case";
import { CookieSessionService } from "./cookie-session.service";
import { resolvePublicBaseUrl, shouldUseSecureCookie } from "./public-base-url.resolver";
import { sendJsonError, toErrorMessage } from "./error-response";

export interface AuthHandlersDeps {
  startOAuthUseCase: StartOAuthUseCase;
  completeOAuthCallbackUseCase: CompleteOAuthCallbackUseCase;
  getCurrentUserUseCase: GetCurrentUserUseCase;
  logoutUseCase: LogoutUseCase;
  cookieSessionService: CookieSessionService;
  explicitPublicBaseUrl: string | null;
}

export class AuthHandlers {
  constructor(private readonly deps: AuthHandlersDeps) {}

  health = (_req: Request, res: Response): void => {
    res.json({ status: "ok", service: "bff-service" });
  };

  googleStart = (req: Request, res: Response): void => {
    void this.startOAuth(req, res, "google");
  };

  githubStart = (req: Request, res: Response): void => {
    void this.startOAuth(req, res, "github");
  };

  googleCallback = (req: Request, res: Response): void => {
    void this.completeOAuthCallback(req, res, "google");
  };

  githubCallback = (req: Request, res: Response): void => {
    void this.completeOAuthCallback(req, res, "github");
  };

  me = (req: Request, res: Response): void => {
    void this.getCurrentUser(req, res);
  };

  logout = (req: Request, res: Response): void => {
    void this.performLogout(req, res);
  };

  private async startOAuth(req: Request, res: Response, provider: OAuthProvider): Promise<void> {
    const publicBaseUrl = resolvePublicBaseUrl(req, this.deps.explicitPublicBaseUrl);
    if (!publicBaseUrl) {
      sendJsonError(res, 500, "Unable to resolve public base URL");
      return;
    }

    try {
      const redirectUrl = await this.deps.startOAuthUseCase.execute(provider, publicBaseUrl);
      res.redirect(302, redirectUrl);
    } catch (err) {
      logger.error({ err, provider }, "BFF failed to start OAuth");
      res.redirect(302, buildFrontendErrorRedirect(publicBaseUrl, provider, toErrorMessage(err, "Failed to start OAuth")));
    }
  }

  private async completeOAuthCallback(req: Request, res: Response, provider: OAuthProvider): Promise<void> {
    const publicBaseUrl = resolvePublicBaseUrl(req, this.deps.explicitPublicBaseUrl);
    if (!publicBaseUrl) {
      sendJsonError(res, 500, "Unable to resolve public base URL");
      return;
    }

    const code = firstQueryValue(req.query.code);
    const state = firstQueryValue(req.query.state);
    if (!code || !state) {
      res.redirect(302, buildFrontendErrorRedirect(publicBaseUrl, provider, "Missing code/state on OAuth callback"));
      return;
    }

    try {
      const accessToken = await this.deps.completeOAuthCallbackUseCase.execute(provider, code, state);
      this.deps.cookieSessionService.writeSessionCookie(
        res,
        accessToken,
        shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl)
      );
      res.redirect(302, `${publicBaseUrl}/`);
    } catch (err) {
      logger.error({ err, provider }, "BFF failed to complete OAuth callback");
      this.deps.cookieSessionService.clearSessionCookie(
        res,
        shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl)
      );
      res.redirect(302, buildFrontendErrorRedirect(publicBaseUrl, provider, toErrorMessage(err, "OAuth callback failed")));
    }
  }

  private async getCurrentUser(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);

    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }

    try {
      const user = await this.deps.getCurrentUserUseCase.execute(token);
      res.json(user);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      logger.error({ err }, "BFF failed to load current user");
      sendJsonError(res, 502, "Identity service unavailable");
    }
  }

  private async performLogout(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);

    if (token) {
      try {
        await this.deps.logoutUseCase.execute(token);
      } catch (err) {
        logger.warn({ err }, "BFF failed to call IAM logout, cleaning local session anyway");
      }
    }

    this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
    res.status(204).send();
  }
}

function buildFrontendErrorRedirect(publicBaseUrl: string, provider: OAuthProvider, errorMessage: string): string {
  const url = new URL("/", publicBaseUrl);
  url.searchParams.set("auth_error", errorMessage);
  url.searchParams.set("auth_provider", provider);
  return url.toString();
}

function firstQueryValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

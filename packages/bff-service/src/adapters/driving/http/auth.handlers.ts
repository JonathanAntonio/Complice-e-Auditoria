import type { Request, Response } from "express";
import { logger } from "@lframework/shared";
import type { OAuthProvider } from "../../../domain/oauth";
import { UpstreamHttpError } from "../../../application/errors/upstream-http.error";
import { parseCreateComplianceViolationDto } from "../../../application/dtos/create-compliance-violation.dto";
import { parseUpdateComplianceViolationDto } from "../../../application/dtos/update-compliance-violation.dto";
import { parseAuditLogsQueryDto } from "../../../application/dtos/audit-log-response.dto";
import { StartOAuthUseCase } from "../../../application/use-cases/start-oauth.use-case";
import { CompleteOAuthCallbackUseCase } from "../../../application/use-cases/complete-oauth-callback.use-case";
import { GetCurrentUserUseCase } from "../../../application/use-cases/get-current-user.use-case";
import { LogoutUseCase } from "../../../application/use-cases/logout.use-case";
import { CreateComplianceViolationUseCase } from "../../../application/use-cases/create-compliance-violation.use-case";
import { ListComplianceViolationsUseCase } from "../../../application/use-cases/list-compliance-violations.use-case";
import { UpdateComplianceViolationUseCase } from "../../../application/use-cases/update-compliance-violation.use-case";
import { ListAuditLogsUseCase } from "../../../application/use-cases/list-audit-logs.use-case";
import { CookieSessionService } from "./cookie-session.service";
import { resolvePublicBaseUrl, shouldUseSecureCookie } from "./public-base-url.resolver";
import { sendJsonError, toErrorMessage } from "./error-response";

export interface AuthHandlersDeps {
  startOAuthUseCase: StartOAuthUseCase;
  completeOAuthCallbackUseCase: CompleteOAuthCallbackUseCase;
  getCurrentUserUseCase: GetCurrentUserUseCase;
  logoutUseCase: LogoutUseCase;
  createComplianceViolationUseCase: CreateComplianceViolationUseCase;
  updateComplianceViolationUseCase: UpdateComplianceViolationUseCase;
  listComplianceViolationsUseCase: ListComplianceViolationsUseCase;
  listAuditLogsUseCase: ListAuditLogsUseCase;
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

  listComplianceViolations = (req: Request, res: Response): void => {
    void this.handleListComplianceViolations(req, res);
  };

  createComplianceViolation = (req: Request, res: Response): void => {
    void this.handleCreateComplianceViolation(req, res);
  };

  updateComplianceViolation = (req: Request, res: Response): void => {
    void this.handleUpdateComplianceViolation(req, res);
  };

  listAuditLogs = (req: Request, res: Response): void => {
    void this.handleListAuditLogs(req, res);
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

  private async handleListComplianceViolations(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);

    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }

    try {
      const items = await this.deps.listComplianceViolationsUseCase.execute(token);
      res.json(items);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }

      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para visualizar violações");
        return;
      }

      logger.error({ err }, "BFF failed to list compliance violations");
      sendJsonError(res, 502, "Compliance service unavailable");
    }
  }

  private async handleCreateComplianceViolation(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);

    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }

    const parsedBody = parseCreateComplianceViolationDto(req.body);
    if (!parsedBody) {
      sendJsonError(res, 400, "Payload inválido para criação de violação");
      return;
    }

    try {
      const created = await this.deps.createComplianceViolationUseCase.execute(token, parsedBody);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }

      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para criar violação");
        return;
      }

      if (err instanceof UpstreamHttpError && err.statusCode === 400) {
        sendJsonError(res, 400, "Payload inválido para criação de violação");
        return;
      }

      logger.error({ err }, "BFF failed to create compliance violation");
      sendJsonError(res, 502, "Compliance service unavailable");
    }
  }

  private async handleUpdateComplianceViolation(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    const violationId = typeof req.params.violationId === "string" ? req.params.violationId.trim() : "";

    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }

    if (!violationId) {
      sendJsonError(res, 400, "ID inválido para edição de violação");
      return;
    }

    const parsedBody = parseUpdateComplianceViolationDto(req.body);
    if (!parsedBody) {
      sendJsonError(res, 400, "Payload inválido para edição de violação");
      return;
    }

    try {
      const updated = await this.deps.updateComplianceViolationUseCase.execute(token, violationId, parsedBody);
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }

      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para editar violação");
        return;
      }

      if (err instanceof UpstreamHttpError && err.statusCode === 404) {
        sendJsonError(res, 404, "Violação não encontrada");
        return;
      }

      if (err instanceof UpstreamHttpError && err.statusCode === 400) {
        sendJsonError(res, 400, "Payload inválido para edição de violação");
        return;
      }

      logger.error({ err }, "BFF failed to update compliance violation");
      sendJsonError(res, 502, "Compliance service unavailable");
    }
  }

  private async handleListAuditLogs(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);

    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }

    try {
      const query = parseAuditLogsQueryDto(req.query);
      const logs = await this.deps.listAuditLogsUseCase.execute(token, query);
      res.json(logs);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para visualizar logs de auditoria");
        return;
      }
      logger.error({ err }, "BFF failed to list audit logs");
      sendJsonError(res, 502, "Audit service unavailable");
    }
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

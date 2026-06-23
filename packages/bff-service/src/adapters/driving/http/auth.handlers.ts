import type { Request, Response } from "express";
import { logger, createEventEnvelopeV1 } from "@lframework/shared";
import type { OAuthProvider } from "../../../domain/oauth";
import { UpstreamHttpError } from "../../../application/errors/upstream-http.error";
import {
  type MessagingFlowQueryDto,
  parseAdminCreateUserInputDto,
  parseAdminUpdateUserRolesInputDto,
  parseAdminUpdateUserSecurityInputDto,
  parseAdminUsersQueryDto,
  parseAuditLogsQueryDto,
  parseCreateComplianceViolationDto,
  parseCreateReportExportDto,
  parseReportKpisQueryDto,
  parseDispatchNotificationDto,
  parseUpsertNotificationPreferenceDto,
  parseLoginInputDto,
  parsePublishIntegrationEventDto,
  parseRegisterInputDto,
  parseRetentionRunsQueryDto,
  parseRiskEventInputDto,
  parseRiskScoreHistoryQueryDto,
  parseRiskScoresQueryDto,
  parseUpdateComplianceViolationDto,
} from "../../../application/dtos";
import {
  CompleteOAuthCallbackUseCase,
  CreateAdminUserUseCase,
  CreateComplianceViolationUseCase,
  CreateReportExportUseCase,
  DeactivateAdminUserUseCase,
  DispatchNotificationUseCase,
  DownloadReportExportUseCase,
  GetNotificationPreferenceUseCase,
  GetAdminUserUseCase,
  GetCurrentUserUseCase,
  GetMessagingFlowUseCase,
  GetReportExportUseCase,
  GetReportKpisUseCase,
  GetRiskScoreHistoryUseCase,
  IngestFrontendAuditLogUseCase,
  IngestRiskEventUseCase,
  ListAdminUsersUseCase,
  ListAuditLogsUseCase,
  ListAuditRetentionRunsUseCase,
  ListComplianceRetentionRunsUseCase,
  ListComplianceViolationsUseCase,
  ListNotificationLogsUseCase,
  ListRiskScoresUseCase,
  LoginUseCase,
  LogoutUseCase,
  PublishIntegrationEventUseCase,
  RegisterUseCase,
  StartOAuthUseCase,
  UpdateAdminUserRolesUseCase,
  UpsertNotificationPreferenceUseCase,
  UpdateAdminUserSecurityUseCase,
  UpdateComplianceViolationUseCase,
} from "../../../application/use-cases";
import { IntegrationAuditHttpClient } from "../../driven/http/integration-audit-http.client";
import { CookieSessionService } from "./cookie-session.service";
import { resolvePublicBaseUrl, shouldUseSecureCookie } from "./public-base-url.resolver";
import { sendJsonError, toErrorMessage } from "./error-response";

export interface AuthHandlersDeps {
  loginUseCase: LoginUseCase;
  registerUseCase: RegisterUseCase;
  startOAuthUseCase: StartOAuthUseCase;
  completeOAuthCallbackUseCase: CompleteOAuthCallbackUseCase;
  getCurrentUserUseCase: GetCurrentUserUseCase;
  logoutUseCase: LogoutUseCase;
  createComplianceViolationUseCase: CreateComplianceViolationUseCase;
  updateComplianceViolationUseCase: UpdateComplianceViolationUseCase;
  listComplianceViolationsUseCase: ListComplianceViolationsUseCase;
  listAuditLogsUseCase: ListAuditLogsUseCase;
  listAuditRetentionRunsUseCase: ListAuditRetentionRunsUseCase;
  listComplianceRetentionRunsUseCase: ListComplianceRetentionRunsUseCase;
  listRiskScoresUseCase: ListRiskScoresUseCase;
  getRiskScoreHistoryUseCase: GetRiskScoreHistoryUseCase;
  getMessagingFlowUseCase: GetMessagingFlowUseCase;
  ingestRiskEventUseCase: IngestRiskEventUseCase;
  createReportExportUseCase: CreateReportExportUseCase;
  getReportKpisUseCase: GetReportKpisUseCase;
  getReportExportUseCase: GetReportExportUseCase;
  downloadReportExportUseCase: DownloadReportExportUseCase;
  dispatchNotificationUseCase: DispatchNotificationUseCase;
  listNotificationLogsUseCase: ListNotificationLogsUseCase;
  getNotificationPreferenceUseCase: GetNotificationPreferenceUseCase;
  upsertNotificationPreferenceUseCase: UpsertNotificationPreferenceUseCase;
  listAdminUsersUseCase: ListAdminUsersUseCase;
  getAdminUserUseCase: GetAdminUserUseCase;
  createAdminUserUseCase: CreateAdminUserUseCase;
  updateAdminUserRolesUseCase: UpdateAdminUserRolesUseCase;
  updateAdminUserSecurityUseCase: UpdateAdminUserSecurityUseCase;
  deactivateAdminUserUseCase: DeactivateAdminUserUseCase;
  publishIntegrationEventUseCase: PublishIntegrationEventUseCase;
  ingestFrontendAuditLogUseCase: IngestFrontendAuditLogUseCase;
  integrationAuditPublisher: IntegrationAuditHttpClient;
  cookieSessionService: CookieSessionService;
  explicitPublicBaseUrl: string | null;
}

export class AuthHandlers {
  constructor(private readonly deps: AuthHandlersDeps) {}

  health = (_req: Request, res: Response): void => {
    res.json({ status: "ok", service: "bff-service" });
  };

  login = (req: Request, res: Response): void => {
    void this.handleLogin(req, res);
  };

  register = (req: Request, res: Response): void => {
    void this.handleRegister(req, res);
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

  googleExchange = (req: Request, res: Response): void => {
    void this.completeOAuthExchange(req, res, "google");
  };

  githubExchange = (req: Request, res: Response): void => {
    void this.completeOAuthExchange(req, res, "github");
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

  listAuditRetentionRuns = (req: Request, res: Response): void => {
    void this.handleListAuditRetentionRuns(req, res);
  };

  listComplianceRetentionRuns = (req: Request, res: Response): void => {
    void this.handleListComplianceRetentionRuns(req, res);
  };

  listRiskScores = (req: Request, res: Response): void => {
    void this.handleListRiskScores(req, res);
  };

  getMessagingFlow = (req: Request, res: Response): void => {
    void this.handleGetMessagingFlow(req, res);
  };

  getRiskScoreHistory = (req: Request, res: Response): void => {
    void this.handleGetRiskScoreHistory(req, res);
  };

  ingestRiskEvent = (req: Request, res: Response): void => {
    void this.handleIngestRiskEvent(req, res);
  };

  createReportExport = (req: Request, res: Response): void => {
    void this.handleCreateReportExport(req, res);
  };

  getReportKpis = (req: Request, res: Response): void => {
    void this.handleGetReportKpis(req, res);
  };

  getReportExport = (req: Request, res: Response): void => {
    void this.handleGetReportExport(req, res);
  };

  downloadReportExport = (req: Request, res: Response): void => {
    void this.handleDownloadReportExport(req, res);
  };

  dispatchNotification = (req: Request, res: Response): void => {
    void this.handleDispatchNotification(req, res);
  };

  listNotificationLogs = (req: Request, res: Response): void => {
    void this.handleListNotificationLogs(req, res);
  };

  getNotificationPreference = (req: Request, res: Response): void => {
    void this.handleGetNotificationPreference(req, res);
  };

  upsertNotificationPreference = (req: Request, res: Response): void => {
    void this.handleUpsertNotificationPreference(req, res);
  };

  listAdminUsers = (req: Request, res: Response): void => {
    void this.handleListAdminUsers(req, res);
  };

  getAdminUser = (req: Request, res: Response): void => {
    void this.handleGetAdminUser(req, res);
  };

  createAdminUser = (req: Request, res: Response): void => {
    void this.handleCreateAdminUser(req, res);
  };

  updateAdminUserRoles = (req: Request, res: Response): void => {
    void this.handleUpdateAdminUserRoles(req, res);
  };

  updateAdminUserSecurity = (req: Request, res: Response): void => {
    void this.handleUpdateAdminUserSecurity(req, res);
  };

  deactivateAdminUser = (req: Request, res: Response): void => {
    void this.handleDeactivateAdminUser(req, res);
  };

  publishIntegrationEvent = (req: Request, res: Response): void => {
    void this.handlePublishIntegrationEvent(req, res);
  };

  ingestFrontendAuditLog = (req: Request, res: Response): void => {
    void this.handleIngestFrontendAuditLog(req, res);
  };

  private async handleLogin(req: Request, res: Response): Promise<void> {
    const input = parseLoginInputDto(req.body);
    if (!input) {
      sendJsonError(res, 400, "Dados de login inválidos");
      return;
    }

    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);

    try {
      const accessToken = await this.deps.loginUseCase.execute(input);
      this.deps.cookieSessionService.writeSessionCookie(res, accessToken, secureCookie);
      res.status(204).send();
    } catch (err) {
      logger.error({ err, email: input.email }, "BFF failed local login");
      this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);

      if (err instanceof UpstreamHttpError && (err.statusCode === 400 || err.statusCode === 401 || err.statusCode === 403)) {
        sendJsonError(res, err.statusCode, toErrorMessage(err, "Falha na autenticação"));
        return;
      }

      sendJsonError(res, 502, toErrorMessage(err, "Serviço de identidade indisponível"));
    }
  }

  private async handleRegister(req: Request, res: Response): Promise<void> {
    const input = parseRegisterInputDto(req.body);
    if (!input) {
      sendJsonError(res, 400, "Dados de registro inválidos");
      return;
    }

    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);

    try {
      const accessToken = await this.deps.registerUseCase.execute(input);
      this.deps.cookieSessionService.writeSessionCookie(res, accessToken, secureCookie);
      res.status(204).send();
    } catch (err) {
      logger.error({ err, email: input.email }, "BFF failed local register");
      this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);

      if (err instanceof UpstreamHttpError && (err.statusCode === 400 || err.statusCode === 409)) {
        sendJsonError(res, err.statusCode, toErrorMessage(err, "Falha no registro"));
        return;
      }

      sendJsonError(res, 502, toErrorMessage(err, "Serviço de identidade indisponível"));
    }
  }

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

  private async completeOAuthExchange(req: Request, res: Response, provider: OAuthProvider): Promise<void> {
    const code = firstQueryValue(req.query.code) ?? firstBodyString(req.body, "code");
    const state = firstQueryValue(req.query.state) ?? firstBodyString(req.body, "state");
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);

    if (!code || !state) {
      sendJsonError(res, 400, "Missing code/state on OAuth callback");
      return;
    }

    const existingToken = this.deps.cookieSessionService.readSessionToken(req);
    if (existingToken) {
      try {
        await this.deps.getCurrentUserUseCase.execute(existingToken);
        logger.info({ provider }, "User already authenticated with valid token, skipping OAuth exchange");
        res.status(204).send();
        return;
      } catch (authErr) {
        // Token is invalid/expired, we clean the cookie and proceed to exchange the code
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
      }
    }

    try {
      const accessToken = await this.deps.completeOAuthCallbackUseCase.execute(provider, code, state);
      this.deps.cookieSessionService.writeSessionCookie(res, accessToken, secureCookie);
      res.status(204).send();
    } catch (err) {
      if (
        (err instanceof UpstreamHttpError && err.statusCode === 400 && isInvalidOrExpiredStateError(err.message)) ||
        (err instanceof UpstreamHttpError && err.statusCode === 401 && err.message === "OAuth authentication failed")
      ) {
        const afterToken = this.deps.cookieSessionService.readSessionToken(req);
        if (afterToken) {
          logger.warn({ provider }, "Ignoring duplicated OAuth exchange callback with already-authenticated session");
          res.status(204).send();
          return;
        }
      }

      logger.error({ err, provider }, "BFF failed to complete OAuth exchange");
      if (existingToken) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
      }

      if (err instanceof UpstreamHttpError && (err.statusCode === 400 || err.statusCode === 401 || err.statusCode === 403)) {
        sendJsonError(res, err.statusCode, toErrorMessage(err, "OAuth callback failed"));
        return;
      }

      sendJsonError(res, 502, toErrorMessage(err, "OAuth callback failed"));
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
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;

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
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;

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
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;

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
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;

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

  private async handleListAuditRetentionRuns(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);

    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;
    if (!tokenHasAnyPermission(token, ["risk.scores.read", "reports.read"])) {
      sendJsonError(res, 403, "Sem permissão para visualizar pontuações de risco");
      return;
    }

    try {
      const query = parseRetentionRunsQueryDto(req.query);
      const logs = await this.deps.listAuditRetentionRunsUseCase.execute(token, query);
      res.json(logs);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para visualizar runs de retenção de auditoria");
        return;
      }
      logger.error({ err }, "BFF failed to list audit retention runs");
      sendJsonError(res, 502, "Audit service unavailable");
    }
  }

  private async handleListComplianceRetentionRuns(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);

    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;

    try {
      const query = parseRetentionRunsQueryDto(req.query);
      const logs = await this.deps.listComplianceRetentionRunsUseCase.execute(token, query);
      res.json(logs);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para visualizar runs de retenção de compliance");
        return;
      }
      logger.error({ err }, "BFF failed to list compliance retention runs");
      sendJsonError(res, 502, "Compliance service unavailable");
    }
  }

  private async handleListRiskScores(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);

    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;

    try {
      const query = parseRiskScoresQueryDto(req.query);
      const result = await this.deps.listRiskScoresUseCase.execute(token, query);
      res.json(result);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para visualizar pontuações de risco");
        return;
      }
      logger.error({ err }, "BFF failed to list risk scores");
      sendJsonError(res, 502, "Risk service unavailable");
    }
  }

  private async handleGetRiskScoreHistory(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    const entityTypeRaw = typeof req.params.entityType === "string" ? req.params.entityType.trim().toLowerCase() : "";
    const entityId = typeof req.params.entityId === "string" ? req.params.entityId.trim() : "";
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;
    if (!tokenHasAnyPermission(token, ["risk.scores.read", "reports.read"])) {
      sendJsonError(res, 403, "Sem permissão para visualizar histórico de risco");
      return;
    }
    if (!entityId || (entityTypeRaw !== "user" && entityTypeRaw !== "area" && entityTypeRaw !== "process")) {
      sendJsonError(res, 400, "Parâmetros inválidos para histórico de risco");
      return;
    }

    try {
      const query = parseRiskScoreHistoryQueryDto(req.query);
      const result = await this.deps.getRiskScoreHistoryUseCase.execute(
        token,
        entityTypeRaw,
        entityId,
        query
      );
      res.json(result);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para visualizar histórico de risco");
        return;
      }
      logger.error({ err }, "BFF failed to get risk score history");
      sendJsonError(res, 502, "Risk service unavailable");
    }
  }

  private async handleGetMessagingFlow(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;
    if (!tokenHasAnyPermission(token, ["audit.logs.read.any", "audit.logs.read.scoped", "reports.read", "reports.export", "system.settings.manage"])) {
      sendJsonError(res, 403, "Sem permissão para visualizar fluxo de mensageria");
      return;
    }

    try {
      const result = await this.deps.getMessagingFlowUseCase.execute(token, parseMessagingFlowQuery(req.query));
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 400) {
        sendJsonError(res, 400, toErrorMessage(err, "Parâmetros inválidos para fluxo de mensageria"));
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para visualizar fluxo de mensageria");
        return;
      }
      logger.error({ err }, "BFF failed to get messaging flow");
      sendJsonError(res, 502, "Messaging service unavailable");
    }
  }

  private async handleIngestRiskEvent(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);

    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;
    if (!tokenHasPermission(token, "system.settings.manage")) {
      sendJsonError(res, 403, "Sem permissão para registrar evento de risco");
      return;
    }

    const payload = parseRiskEventInputDto(req.body);
    if (!payload) {
      sendJsonError(res, 400, "Payload inválido para evento de risco");
      return;
    }

    try {
      const result = await this.deps.ingestRiskEventUseCase.execute(token, payload);
      await this.publishBestEffortAuditEvent(req, "bff.risk.event.ingested", {
        actorId: extractActorIdFromToken(token),
        entityUserId: payload.userId,
        area: payload.area,
        processType: payload.processType,
        severity: payload.severity,
        accepted: result.accepted,
      });
      res.status(202).json(result);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para registrar evento de risco");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 400) {
        sendJsonError(res, 400, "Payload inválido para evento de risco");
        return;
      }
      logger.error({ err }, "BFF failed to ingest risk event");
      sendJsonError(res, 502, "Risk service unavailable");
    }
  }

  private async handleCreateReportExport(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;

    const parsedBody = parseCreateReportExportDto(req.body);
    if (!parsedBody) {
      sendJsonError(res, 400, "Payload inválido para exportação");
      return;
    }

    try {
      const created = await this.deps.createReportExportUseCase.execute(token, parsedBody);
      await this.publishCriticalAuditEvent(req, "bff.reports.export.requested", {
        actorId: extractActorIdFromToken(token),
        exportId: created.id,
        scope: created.scope,
        format: created.format,
        requestedBy: created.requestedBy,
        requestedAtUTC: created.createdAtUTC,
        filters: created.filters ?? parsedBody.filters ?? {},
        status: created.status,
      });
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para gerar exportação");
        return;
      }
      logger.error({ err }, "BFF failed to create report export");
      sendJsonError(res, 502, "Reporting service unavailable");
    }
  }

  private async handleGetReportKpis(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;
    if (!tokenHasAnyPermission(token, ["reports.read", "reports.export", "system.settings.manage"])) {
      sendJsonError(res, 403, "Sem permissão para visualizar KPIs");
      return;
    }

    try {
      const query = parseReportKpisQueryDto(req.query);
      const result = await this.deps.getReportKpisUseCase.execute(token, query);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para visualizar KPIs");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 400) {
        sendJsonError(res, 400, "Parâmetros inválidos para KPIs");
        return;
      }
      logger.error({ err }, "BFF failed to get report KPIs");
      sendJsonError(res, 502, "Reporting service unavailable");
    }
  }

  private async handleGetReportExport(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    const id = typeof req.params.id === "string" ? req.params.id.trim() : "";
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;
    if (!id) {
      sendJsonError(res, 400, "ID inválido de exportação");
      return;
    }

    try {
      const result = await this.deps.getReportExportUseCase.execute(token, id);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 404) {
        sendJsonError(res, 404, "Exportação não encontrada");
        return;
      }
      logger.error({ err }, "BFF failed to get report export");
      sendJsonError(res, 502, "Reporting service unavailable");
    }
  }

  private async handleDownloadReportExport(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    const id = typeof req.params.id === "string" ? req.params.id.trim() : "";
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;
    if (!id) {
      sendJsonError(res, 400, "ID inválido de exportação");
      return;
    }

    try {
      const result = await this.deps.downloadReportExportUseCase.execute(token, id);
      await this.publishCriticalAuditEvent(req, "bff.reports.export.downloaded", {
        actorId: extractActorIdFromToken(token),
        exportId: id,
        contentType: result.contentType,
      });
      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Content-Disposition", result.contentDisposition);
      res.status(200).send(result.body);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 404) {
        sendJsonError(res, 404, "Exportação não encontrada");
        return;
      }
      logger.error({ err }, "BFF failed to download report export");
      sendJsonError(res, 502, "Reporting service unavailable");
    }
  }

  private async handleDispatchNotification(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;

    const parsedBody = parseDispatchNotificationDto(req.body);
    if (!parsedBody) {
      sendJsonError(res, 400, "Payload inválido para envio de notificação");
      return;
    }

    try {
      await this.publishCriticalAuditEvent(req, "bff.notifications.dispatch.requested", {
        actorId: extractActorIdFromToken(token),
        channel: parsedBody.channel,
        recipient: parsedBody.recipient,
        severity: parsedBody.severity,
      });
      const result = await this.deps.dispatchNotificationUseCase.execute(token, parsedBody);
      await this.publishCriticalAuditEvent(req, "bff.notifications.dispatch.completed", {
        actorId: extractActorIdFromToken(token),
        notificationId: result.id,
        status: result.status,
        channel: result.channel,
        recipient: result.recipient,
      });
      res.status(202).json(result);
    } catch (err) {
      await this.publishBestEffortAuditEvent(req, "bff.notifications.dispatch.failed", {
        actorId: extractActorIdFromToken(token),
        channel: parsedBody.channel,
        recipient: parsedBody.recipient,
        severity: parsedBody.severity,
        error: toErrorMessage(err, "notification_dispatch_failed"),
      });
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para enviar notificação");
        return;
      }
      logger.error({ err }, "BFF failed to dispatch notification");
      sendJsonError(res, 502, "Notification service unavailable");
    }
  }

  private async handleListNotificationLogs(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;

    try {
      const result = await this.deps.listNotificationLogsUseCase.execute(token);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para visualizar notificações");
        return;
      }
      logger.error({ err }, "BFF failed to list notification logs");
      sendJsonError(res, 502, "Notification service unavailable");
    }
  }

  private async handleGetNotificationPreference(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    const recipient = typeof req.params.recipient === "string" ? req.params.recipient.trim().toLowerCase() : "";
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;
    if (!recipient) {
      sendJsonError(res, 400, "Destinatário inválido");
      return;
    }

    try {
      const result = await this.deps.getNotificationPreferenceUseCase.execute(token, recipient);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para visualizar preferências");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 404) {
        sendJsonError(res, 404, "Preferência não encontrada");
        return;
      }
      logger.error({ err }, "BFF failed to get notification preference");
      sendJsonError(res, 502, "Notification service unavailable");
    }
  }

  private async handleUpsertNotificationPreference(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    const recipient = typeof req.params.recipient === "string" ? req.params.recipient.trim().toLowerCase() : "";
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;
    if (!recipient) {
      sendJsonError(res, 400, "Destinatário inválido");
      return;
    }
    const payload = parseUpsertNotificationPreferenceDto(req.body);
    if (!payload) {
      sendJsonError(res, 400, "Payload inválido para preferência de notificação");
      return;
    }

    try {
      const result = await this.deps.upsertNotificationPreferenceUseCase.execute(token, recipient, payload);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para atualizar preferências");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 400) {
        sendJsonError(res, 400, toErrorMessage(err, "Payload inválido para preferência de notificação"));
        return;
      }
      logger.error({ err }, "BFF failed to upsert notification preference");
      sendJsonError(res, 502, "Notification service unavailable");
    }
  }

  private async handleListAdminUsers(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;

    try {
      const query = parseAdminUsersQueryDto(req.query);
      const result = await this.deps.listAdminUsersUseCase.execute(token, query);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para listar usuários");
        return;
      }
      logger.error({ err }, "BFF failed to list users");
      sendJsonError(res, 502, "Identity service unavailable");
    }
  }

  private async handleGetAdminUser(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    const userId = typeof req.params.userId === "string" ? req.params.userId.trim() : "";
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;
    if (!userId) {
      sendJsonError(res, 400, "ID de usuário inválido");
      return;
    }

    try {
      const result = await this.deps.getAdminUserUseCase.execute(token, userId);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para visualizar usuário");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 404) {
        sendJsonError(res, 404, "Usuário não encontrado");
        return;
      }
      logger.error({ err }, "BFF failed to get user details");
      sendJsonError(res, 502, "Identity service unavailable");
    }
  }

  private async handleCreateAdminUser(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;

    let input;
    try {
      input = parseAdminCreateUserInputDto(req.body);
    } catch {
      sendJsonError(res, 400, "Payload inválido para criação de usuário");
      return;
    }

    try {
      const result = await this.deps.createAdminUserUseCase.execute(token, input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para criar usuários");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 409) {
        sendJsonError(res, 409, "Usuário com este e-mail já existe");
        return;
      }
      logger.error({ err }, "BFF failed to create user");
      sendJsonError(res, 502, "Identity service unavailable");
    }
  }

  private async handleUpdateAdminUserRoles(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    const userId = typeof req.params.userId === "string" ? req.params.userId.trim() : "";
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;
    if (!userId) {
      sendJsonError(res, 400, "ID de usuário inválido");
      return;
    }

    let input;
    try {
      input = parseAdminUpdateUserRolesInputDto(req.body);
    } catch {
      sendJsonError(res, 400, "Payload inválido para atualização de cargos");
      return;
    }

    try {
      const result = await this.deps.updateAdminUserRolesUseCase.execute(token, userId, input);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para atualizar cargos");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 404) {
        sendJsonError(res, 404, "Usuário não encontrado");
        return;
      }
      logger.error({ err }, "BFF failed to update user roles");
      sendJsonError(res, 502, "Identity service unavailable");
    }
  }

  private async handleUpdateAdminUserSecurity(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    const userId = typeof req.params.userId === "string" ? req.params.userId.trim() : "";
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;
    if (!userId) {
      sendJsonError(res, 400, "ID de usuário inválido");
      return;
    }

    let input;
    try {
      input = parseAdminUpdateUserSecurityInputDto(req.body);
    } catch {
      sendJsonError(res, 400, "Payload inválido para atualização de segurança");
      return;
    }

    try {
      const result = await this.deps.updateAdminUserSecurityUseCase.execute(token, userId, input);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para atualizar segurança do usuário");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 404) {
        sendJsonError(res, 404, "Usuário não encontrado");
        return;
      }
      logger.error({ err }, "BFF failed to update user security");
      sendJsonError(res, 502, "Identity service unavailable");
    }
  }

  private async handleDeactivateAdminUser(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    const userId = typeof req.params.userId === "string" ? req.params.userId.trim() : "";
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;
    if (!userId) {
      sendJsonError(res, 400, "ID de usuário inválido");
      return;
    }

    try {
      const result = await this.deps.deactivateAdminUserUseCase.execute(token, userId);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 403) {
        sendJsonError(res, 403, "Sem permissão para desativar usuários");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 404) {
        sendJsonError(res, 404, "Usuário não encontrado");
        return;
      }
      logger.error({ err }, "BFF failed to deactivate user");
      sendJsonError(res, 502, "Identity service unavailable");
    }
  }

  private async handlePublishIntegrationEvent(req: Request, res: Response): Promise<void> {
    const token = this.deps.cookieSessionService.readSessionToken(req);
    const secureCookie = shouldUseSecureCookie(req, this.deps.explicitPublicBaseUrl);
    if (!token) {
      sendJsonError(res, 401, "Não autenticado");
      return;
    }
    if (!(await this.ensureSessionActive(token, req, res, secureCookie))) return;
    if (!tokenHasPermission(token, "system.settings.manage")) {
      sendJsonError(res, 403, "Sem permissão para publicar evento de integração");
      return;
    }

    const payload = parsePublishIntegrationEventDto(req.body);
    if (!payload) {
      sendJsonError(res, 400, "Payload inválido para evento de integração");
      return;
    }

    try {
      const result = await this.deps.publishIntegrationEventUseCase.execute(payload);
      await this.publishBestEffortAuditEvent(req, "bff.integration.event.published", {
        actorId: extractActorIdFromToken(token),
        type: payload.type,
        accepted: result.accepted,
        duplicate: result.duplicate,
        sourceEventId: result.eventId,
      });
      res.status(202).json(result);
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        sendJsonError(res, 502, "Integration service unavailable");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 400) {
        sendJsonError(res, 400, "Payload inválido para evento de integração");
        return;
      }
      if (err instanceof UpstreamHttpError && err.statusCode === 429) {
        sendJsonError(res, 429, "Limite de envio de eventos excedido");
        return;
      }
      logger.error({ err }, "BFF failed to publish integration event");
      sendJsonError(res, 502, "Integration service unavailable");
    }
  }

  private async handleIngestFrontendAuditLog(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body;
      if (!body || typeof body.type !== "string" || typeof body.producer !== "string" || typeof body.payload !== "object" || body.payload === null) {
        sendJsonError(res, 400, "Payload inválido para evento de auditoria");
        return;
      }

      const headers = (req.headers ?? {}) as Record<string, unknown>;
      const correlationId = firstHeaderValue(headers["x-correlation-id"]) ?? firstHeaderValue(headers["x-request-id"]);

      const payloadContent: Record<string, unknown> = {
        ...(body.payload as Record<string, unknown>),
      };

      if (typeof body.severity === "string") {
        payloadContent.severity = body.severity;
      }

      const token = this.deps.cookieSessionService.readSessionToken(req);
      if (token) {
        const actorId = extractActorIdFromToken(token);
        if (actorId) {
          payloadContent.actorUserId = actorId;
        }
      }

      const validEnvelope = createEventEnvelopeV1({
        type: body.type,
        producer: body.producer,
        correlationId,
        payload: payloadContent,
      });

      await this.deps.ingestFrontendAuditLogUseCase.execute(validEnvelope);
      res.status(202).send();
    } catch (err) {
      logger.error({ err }, "BFF failed to ingest frontend audit log");
      sendJsonError(res, 502, "Audit service unavailable");
    }
  }

  private async ensureSessionActive(
    token: string,
    _req: Request,
    res: Response,
    secureCookie: boolean
  ): Promise<boolean> {
    try {
      await this.deps.getCurrentUserUseCase.execute(token);
      return true;
    } catch (err) {
      if (err instanceof UpstreamHttpError && err.statusCode === 401) {
        this.deps.cookieSessionService.clearSessionCookie(res, secureCookie);
        sendJsonError(res, 401, "Não autenticado");
        return false;
      }
      logger.error({ err }, "BFF failed to validate active session");
      sendJsonError(res, 502, "Identity service unavailable");
      return false;
    }
  }

  private async publishCriticalAuditEvent(
    req: Request,
    type: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const headers = (req.headers ?? {}) as Record<string, unknown>;
    const correlationId = firstHeaderValue(headers["x-correlation-id"]) ?? firstHeaderValue(headers["x-request-id"]);
    await this.deps.integrationAuditPublisher.publish(type, payload, correlationId);
  }

  private async publishBestEffortAuditEvent(
    req: Request,
    type: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.publishCriticalAuditEvent(req, type, payload);
    } catch (err) {
      logger.warn({ err, type }, "BFF failed to publish best-effort audit event");
    }
  }
}

function parseMessagingFlowQuery(query: Request["query"]): MessagingFlowQueryDto {
  const sourceService = firstQueryValue(query.sourceService)?.trim();
  const eventType = firstQueryValue(query.eventType)?.trim();
  const correlationId = firstQueryValue(query.correlationId)?.trim();
  const notificationStatus = firstQueryValue(query.notificationStatus)?.trim();
  const onlyFailures = parseBooleanQuery(firstQueryValue(query.onlyFailures));
  const auditLimit = parsePositiveIntQuery(firstQueryValue(query.auditLimit));
  const failuresLimit = parsePositiveIntQuery(firstQueryValue(query.failuresLimit));

  return {
    sourceService: sourceService || undefined,
    eventType: eventType || undefined,
    correlationId: correlationId || undefined,
    notificationStatus: notificationStatus === "sent" || notificationStatus === "failed" || notificationStatus === "dead_letter"
      ? notificationStatus
      : undefined,
    onlyFailures,
    auditLimit,
    failuresLimit,
  };
}

function parseBooleanQuery(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parsePositiveIntQuery(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
  return parsed;
}

function isInvalidOrExpiredStateError(message: string): boolean {
  return message.trim().toLowerCase() === "invalid or expired state";
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

function firstHeaderValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

function firstBodyString(body: unknown, key: string): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function extractActorIdFromToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payloadRaw = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(payloadRaw) as { sub?: unknown };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function tokenHasPermission(token: string, permission: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return false;
    const payloadRaw = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(payloadRaw) as { permissions?: unknown };
    if (!Array.isArray(payload.permissions)) return false;
    return payload.permissions.includes(permission);
  } catch {
    return false;
  }
}

function tokenHasAnyPermission(token: string, permissions: string[]): boolean {
  return permissions.some((permission) => tokenHasPermission(token, permission));
}

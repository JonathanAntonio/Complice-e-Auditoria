import { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "@lframework/shared";
import type { RegisterUseCase } from "../../../application/use-cases/register.use-case";
import type { LoginUseCase } from "../../../application/use-cases/login.use-case";
import type { GetCurrentUserUseCase } from "../../../application/use-cases/get-current-user.use-case";
import type { OAuthCallbackUseCase } from "../../../application/use-cases/oauth-callback.use-case";
import type { LogoutUseCase } from "../../../application/use-cases/logout.use-case";
import type { IOAuthProvider } from "../../../application/ports/oauth-provider.port";
import type { ICacheService } from "@lframework/shared";
import type { RegisterDto } from "../../../application/dtos/register.dto";
import type { LoginDto } from "../../../application/dtos/login.dto";
import type { AuthResponseDto } from "../../../application/dtos/auth-response.dto";
import type { OAuthCallbackResponseDto } from "../../../application/dtos/oauth-callback-response.dto";
import {
  oauthCallbackQuerySchema,
  type OAuthCallbackQueryDto,
} from "../../../application/dtos/oauth-callback-query.dto";
import { formatExpiresIn } from "./utils/format-expires-in";
import { performOAuthRedirect, OAUTH_STATE_PREFIX } from "./utils/oauth-redirect";
import { sendError, sendValidationError } from "@lframework/shared";
import type { SecurityAuditContext } from "../../../application/security-audit";

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly oauthCallbackUseCase: OAuthCallbackUseCase,
    private readonly googleProvider: IOAuthProvider | null,
    private readonly githubProvider: IOAuthProvider | null,
    private readonly baseUrl: string,
    private readonly cache: ICacheService,
    private readonly jwtExpiresInSeconds: number,
    private readonly logoutUseCase?: LogoutUseCase
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: RegisterDto = req.body;
      const result = await this.registerUseCase.execute(dto);
      const body: AuthResponseDto = {
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: formatExpiresIn(this.jwtExpiresInSeconds),
      };
      res.status(201).json(body);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: LoginDto = req.body;
      const result = await this.loginUseCase.execute(dto, this.buildAuditContext(req));
      const body: AuthResponseDto = {
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: formatExpiresIn(this.jwtExpiresInSeconds),
      };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  };

  private buildAuditContext(req: Request): SecurityAuditContext {
    const forwardedFor = req.headers["x-forwarded-for"];
    const forwardedIp = typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : undefined;
    const ipAddress = forwardedIp || req.ip;
    return {
      ipAddress,
      requestId: req.headers["x-request-id"]?.toString(),
      correlationId: req.headers["x-correlation-id"]?.toString() ?? req.headers["x-request-id"]?.toString(),
      userAgent: req.headers["user-agent"]?.toString(),
    };
  }

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = await this.getCurrentUserUseCase.execute(authReq.userId);
      if (!user) {
        sendError(res, 404, "User not found");
        return;
      }
      res.json(user);
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.userId) {
        sendError(res, 401, "Unauthorized");
        return;
      }
      if (!this.logoutUseCase) {
        sendError(res, 503, "Logout is not available");
        return;
      }

      await this.logoutUseCase.execute(authReq.userId, this.buildAuditContext(req));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  /** async + await performOAuthRedirect para compatibilidade com asyncHandler e propagação de erros. */
  googleRedirect = async (req: Request, res: Response): Promise<void> => {
    if (!this.googleProvider) {
      sendError(res, 503, "Google OAuth is not configured");
      return;
    }
    await performOAuthRedirect(this.googleProvider, "google", res, this.cache, this.baseUrl);
  };

  googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleOAuthCallback(req, res, next, this.googleProvider, "google");
  };

  /** async + await performOAuthRedirect para compatibilidade com asyncHandler e propagação de erros. */
  githubRedirect = async (req: Request, res: Response): Promise<void> => {
    if (!this.githubProvider) {
      sendError(res, 503, "GitHub OAuth is not configured");
      return;
    }
    await performOAuthRedirect(this.githubProvider, "github", res, this.cache, this.baseUrl);
  };

  githubCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleOAuthCallback(req, res, next, this.githubProvider, "github");
  };

  private handleOAuthCallback = async (
    req: Request,
    res: Response,
    next: NextFunction,
    provider: IOAuthProvider | null,
    providerName: string
  ): Promise<void> => {
    if (!provider) {
      sendError(
        res,
        503,
        providerName.charAt(0).toUpperCase() + providerName.slice(1) + " OAuth is not configured"
      );
      return;
    }
    const code = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
    const state = Array.isArray(req.query.state) ? req.query.state[0] : req.query.state;
    const parsed = oauthCallbackQuerySchema.safeParse({ code, state });
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const query: OAuthCallbackQueryDto = parsed.data;
    const stateKey = OAUTH_STATE_PREFIX + query.state;
    const stateValid = await this.cache.get<string>(stateKey);
    if (!stateValid) {
      sendError(res, 400, "Invalid or expired state");
      return;
    }
    await this.cache.delete(stateKey);

    try {
      const redirectUri = this.baseUrl + "/api/auth/" + providerName + "/callback";
      const result = await this.oauthCallbackUseCase.execute(
        query.code,
        redirectUri,
        provider,
        this.buildAuditContext(req)
      );
      const body: OAuthCallbackResponseDto = {
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: formatExpiresIn(this.jwtExpiresInSeconds),
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  };
}

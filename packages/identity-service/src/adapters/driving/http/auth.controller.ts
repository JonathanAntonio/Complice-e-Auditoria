import { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "@lframework/shared";
import type { GetCurrentUserUseCase } from "../../../application/use-cases/get-current-user.use-case";
import type { OAuthCallbackUseCase } from "../../../application/use-cases/oauth-callback.use-case";
import type { LogoutUseCase } from "../../../application/use-cases/logout.use-case";
import type { IOAuthProvider } from "../../../application/ports/oauth-provider.port";
import type { ICacheService } from "@lframework/shared";
import type { OAuthCallbackResponseDto } from "../../../application/dtos/oauth-callback-response.dto";
import {
  oauthAuthorizationUrlQuerySchema,
} from "../../../application/dtos/oauth-authorization-url-query.dto";
import {
  oauthCallbackQuerySchema,
} from "../../../application/dtos/oauth-callback-query.dto";
import { formatExpiresIn } from "./utils/format-expires-in";
import {
  createOAuthAuthorizationUrl,
  OAUTH_STATE_PREFIX,
} from "./utils/oauth-redirect";
import { sendError, sendValidationError } from "@lframework/shared";
import type { SecurityAuditContext } from "../../../application/security-audit";

export class AuthController {
  constructor(
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly oauthCallbackUseCase: OAuthCallbackUseCase,
    private readonly googleProvider: IOAuthProvider | null,
    private readonly githubProvider: IOAuthProvider | null,
    private readonly baseUrl: string,
    private readonly cache: ICacheService,
    private readonly jwtExpiresInSeconds: number,
    private readonly logoutUseCase?: LogoutUseCase
  ) {}

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

  private firstQueryValue(value: unknown): string | undefined {
    if (Array.isArray(value)) {
      const first = value[0];
      return typeof first === "string" ? first : undefined;
    }
    return typeof value === "string" ? value : undefined;
  }

  private resolveRedirectUriFromStateValue(stateValue: unknown, defaultRedirectUri: string): string | null {
    if (typeof stateValue === "string") {
      if (stateValue === "1") return defaultRedirectUri; // legado
      return stateValue.length > 0 ? stateValue : null;
    }

    if (stateValue && typeof stateValue === "object") {
      const redirectUri = (stateValue as { redirectUri?: unknown }).redirectUri;
      if (typeof redirectUri === "string" && redirectUri.length > 0) {
        return redirectUri;
      }
    }

    return null;
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

  googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleOAuthCallback(req, res, next, this.googleProvider, "google");
  };

  googleAuthorizationUrl = async (req: Request, res: Response): Promise<void> => {
    if (!this.googleProvider) {
      sendError(res, 503, "Google OAuth is not configured");
      return;
    }
    const parsed = oauthAuthorizationUrlQuerySchema.safeParse({
      redirect_uri: this.firstQueryValue(req.query.redirect_uri),
    });
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const url = await createOAuthAuthorizationUrl(
      this.googleProvider,
      "google",
      this.cache,
      this.baseUrl,
      parsed.data.redirect_uri
    );
    res.json({ url });
  };

  githubCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleOAuthCallback(req, res, next, this.githubProvider, "github");
  };

  githubAuthorizationUrl = async (req: Request, res: Response): Promise<void> => {
    if (!this.githubProvider) {
      sendError(res, 503, "GitHub OAuth is not configured");
      return;
    }
    const parsed = oauthAuthorizationUrlQuerySchema.safeParse({
      redirect_uri: this.firstQueryValue(req.query.redirect_uri),
    });
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const url = await createOAuthAuthorizationUrl(
      this.githubProvider,
      "github",
      this.cache,
      this.baseUrl,
      parsed.data.redirect_uri
    );
    res.json({ url });
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
    const parsed = oauthCallbackQuerySchema.safeParse({
      code: this.firstQueryValue(req.query.code),
      state: this.firstQueryValue(req.query.state),
    });
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const query = parsed.data;
    const stateKey = OAUTH_STATE_PREFIX + query.state;
    const stateValue = await this.cache.get<unknown>(stateKey);
    if (!stateValue) {
      sendError(res, 400, "Invalid or expired state");
      return;
    }
    await this.cache.delete(stateKey);
    const defaultRedirectUri = `${this.baseUrl}/api/auth/${providerName}/callback`;
    const redirectUri = this.resolveRedirectUriFromStateValue(stateValue, defaultRedirectUri);
    if (!redirectUri) {
      sendError(res, 400, "Invalid or expired state");
      return;
    }

    try {
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

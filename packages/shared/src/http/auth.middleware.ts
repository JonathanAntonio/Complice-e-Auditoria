import { Request, Response, NextFunction } from "express";
import { sendError } from "./send-error";
import { logger } from "../logger";
import type { IAuthzVersionChecker } from "./authz-version-checker.port";

/**
 * Payload mínimo esperado após verificação do JWT (sub = userId).
 * Serviços podem estender com email, role, etc.
 */
export interface JwtPayload {
  sub: string;
  email?: string;
  primaryRole?: string;
  roles?: string[];
  permissions?: string[];
  permissionsHash?: string;
  authzVersion?: number;
}

function normalizePermissionCode(permission: string): string {
  const normalized = permission.trim().toLowerCase();
  switch (normalized) {
    case "catalog.items.read":
      return "compliance.violations.read";
    case "catalog.items.create":
      return "compliance.violations.create";
    case "catalog.test.access":
      return "compliance.test.access";
    default:
      return normalized;
  }
}

function normalizePermissions(permissions: string[] | undefined): string[] {
  if (!permissions || permissions.length === 0) return [];
  const normalized = new Set<string>();
  for (const permission of permissions) {
    if (typeof permission !== "string") continue;
    const code = normalizePermissionCode(permission);
    if (code) normalized.add(code);
  }
  return [...normalized];
}

/**
 * Este módulo estende globalmente Express.Request com userId, userEmail e userRole.
 * Em monorepos com um app por processo isso é estável; evite misturar múltiplas apps no mesmo processo.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- extensão de tipos do Express
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userRole?: string;
      userPrimaryRole?: string;
      userRoles?: string[];
      userPermissions?: string[];
      authzVersion?: number;
    }
  }
}

/**
 * Request após auth middleware: userId garantido; userEmail e userRole opcionais.
 */
export type AuthenticatedRequest = Request & {
  userId: string;
  userEmail?: string;
  userRole?: string;
  userPrimaryRole?: string;
  userRoles: string[];
  userPermissions: string[];
  authzVersion?: number;
};

/**
 * Middleware: valida Bearer JWT usando a função verify fornecida e anexa contexto autenticado em req.
 * Uso: createAuthMiddleware((token) => tokenService.verify(token)) ou createAuthMiddleware((token) => jwt.verify(...)).
 *
 * Se authzVersionChecker for fornecido, valida a versão do token contra o cache central.
 */
export function createAuthMiddleware(
  verify: (token: string) => JwtPayload | null,
  authzVersionChecker?: IAuthzVersionChecker
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      sendError(res, 401, "Missing or invalid Authorization header");
      return;
    }
    const token = authHeader.slice(7);
    const payload = verify(token);
    if (!payload) {
      sendError(res, 401, "Invalid or expired token");
      return;
    }
    if (!payload.sub || typeof payload.sub !== "string" || !payload.sub.trim()) {
      sendError(res, 401, "Invalid token: missing subject");
      return;
    }

    // Validação de versão de autorização (Fase 10)
    if (authzVersionChecker && typeof payload.authzVersion === "number") {
      const latestVersion = await authzVersionChecker.getLatestVersion(payload.sub);
      if (latestVersion !== null && payload.authzVersion < latestVersion) {
        logger.info(
          { userId: payload.sub, tokenVersion: payload.authzVersion, latestVersion },
          "Session version mismatch (revoked token)"
        );
        sendError(res, 401, "Session version mismatch (revoked token)");
        return;
      }
    }

    req.userId = payload.sub;
    req.userEmail = payload.email;
    req.userPrimaryRole = payload.primaryRole;
    req.userRoles = payload.roles ?? (payload.primaryRole ? [payload.primaryRole] : []);
    req.userRole = payload.primaryRole ?? "user";
    req.userPermissions = normalizePermissions(payload.permissions);
    req.authzVersion = payload.authzVersion;
    next();
  };
}

export function hasPermission(req: Request, permission: string): boolean {
  return req.userPermissions?.includes(permission) ?? false;
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!hasPermission(req, permission)) {
      const authReq = req as AuthenticatedRequest;
      logger.warn(
        {
          audit: true,
          eventType: "identity.auth.permission_denied",
          severity: "medium",
          actorUserId: authReq.userId,
          actorRole: authReq.userPrimaryRole,
          actorPermissions: authReq.userPermissions,
          requiredPermission: permission,
          resource: req.originalUrl,
          method: req.method,
          ipAddress: req.ip,
          requestId: req.headers["x-request-id"]?.toString(),
          correlationId: req.headers["x-correlation-id"]?.toString() ?? req.headers["x-request-id"]?.toString(),
        },
        `Access denied: missing permission '${permission}'`
      );
      sendError(res, 403, "Forbidden");
      return;
    }
    next();
  };
}

export function requireAnyPermission(permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!permissions.some((permission) => hasPermission(req, permission))) {
      const authReq = req as AuthenticatedRequest;
      logger.warn(
        {
          audit: true,
          eventType: "identity.auth.permission_denied",
          severity: "medium",
          actorUserId: authReq.userId,
          actorRole: authReq.userPrimaryRole,
          actorPermissions: authReq.userPermissions,
          requiredPermissions: permissions,
          resource: req.originalUrl,
          method: req.method,
          ipAddress: req.ip,
          requestId: req.headers["x-request-id"]?.toString(),
          correlationId: req.headers["x-correlation-id"]?.toString() ?? req.headers["x-request-id"]?.toString(),
        },
        `Access denied: missing one of permissions [${permissions.join(", ")}]`
      );
      sendError(res, 403, "Forbidden");
      return;
    }
    next();
  };
}

/**
 * Middleware: exige uma permissão ou que o usuário seja o dono do recurso (self).
 * O ID do dono deve ser passado via params[paramName].
 */
export function requirePermissionOrSelf(permission: string, paramName: string = "id") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const isOwner = req.userId === req.params[paramName];
    const hasPerm = hasPermission(req, permission);

    if (!isOwner && !hasPerm) {
      const authReq = req as AuthenticatedRequest;
      logger.warn(
        {
          audit: true,
          eventType: "identity.auth.permission_denied",
          severity: "medium",
          actorUserId: authReq.userId,
          actorRole: authReq.userPrimaryRole,
          actorPermissions: authReq.userPermissions,
          requiredPermission: permission,
          isSelfAccess: false,
          targetResourceId: req.params[paramName],
          resource: req.originalUrl,
          method: req.method,
          ipAddress: req.ip,
          requestId: req.headers["x-request-id"]?.toString(),
          correlationId: req.headers["x-correlation-id"]?.toString() ?? req.headers["x-request-id"]?.toString(),
        },
        `Access denied to resource '${req.params[paramName]}': missing permission '${permission}' and not owner`
      );
      sendError(res, 403, "Forbidden");
      return;
    }
    next();
  };
}

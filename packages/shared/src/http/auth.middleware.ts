import { Request, Response, NextFunction } from "express";
import { sendError } from "./send-error";

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
 */
export function createAuthMiddleware(
  verify: (token: string) => JwtPayload | null
) {
  return (req: Request, res: Response, next: NextFunction): void => {
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
    req.userId = payload.sub;
    req.userEmail = payload.email;
    req.userPrimaryRole = payload.primaryRole;
    req.userRoles = payload.roles ?? (payload.primaryRole ? [payload.primaryRole] : []);
    req.userRole = payload.primaryRole ?? "user";
    req.userPermissions = payload.permissions ?? [];
    req.authzVersion = payload.authzVersion;
    next();
  };
}

/**
 * Middleware: exige que o usuário autenticado tenha a role indicada.
 * Deve ser usado após createAuthMiddleware.
 */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if ((req.userPrimaryRole ?? req.userRole) !== role) {
      sendError(res, 403, "Forbidden");
      return;
    }
    next();
  };
}

export function hasPermission(req: Request, permission: string): boolean {
  return req.userPermissions?.includes(permission) ?? false;
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!hasPermission(req, permission)) {
      sendError(res, 403, "Forbidden");
      return;
    }
    next();
  };
}

export function requireAnyPermission(permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!permissions.some((permission) => hasPermission(req, permission))) {
      sendError(res, 403, "Forbidden");
      return;
    }
    next();
  };
}

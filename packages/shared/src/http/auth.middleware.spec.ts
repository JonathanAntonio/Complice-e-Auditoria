import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAuthMiddleware,
  hasPermission,
  requireAnyPermission,
  requirePermission,
  requireRole,
} from "./auth.middleware";
import type { Request, Response, NextFunction } from "express";

describe("createAuthMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    next = vi.fn();
  });

  it("deve retornar 401 quando Authorization está ausente", () => {
    const verify = vi.fn();
    const middleware = createAuthMiddleware(verify);

    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing or invalid Authorization header",
    });
    expect(verify).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("deve retornar 401 quando Authorization não é Bearer", () => {
    req.headers = { authorization: "Basic xyz" };
    const verify = vi.fn();
    const middleware = createAuthMiddleware(verify);

    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing or invalid Authorization header",
    });
    expect(verify).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("deve retornar 401 quando verify retorna null (token inválido/expirado)", () => {
    req.headers = { authorization: "Bearer invalid-token" };
    const verify = vi.fn().mockReturnValue(null);
    const middleware = createAuthMiddleware(verify);

    middleware(req as Request, res as Response, next);

    expect(verify).toHaveBeenCalledWith("invalid-token");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid or expired token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("deve anexar contexto autenticado e chamar next quando token válido", () => {
    req.headers = { authorization: "Bearer valid-token" };
    const payload = {
      sub: "user-123",
      email: "u@example.com",
      primaryRole: "admin",
      permissions: ["users.create"],
      authzVersion: 2,
    };
    const verify = vi.fn().mockReturnValue(payload);
    const middleware = createAuthMiddleware(verify);

    middleware(req as Request, res as Response, next);

    expect(verify).toHaveBeenCalledWith("valid-token");
    expect(req.userId).toBe("user-123");
    expect(req.userEmail).toBe("u@example.com");
    expect(req.userRole).toBe("admin");
    expect(req.userPrimaryRole).toBe("admin");
    expect(req.userPermissions).toEqual(["users.create"]);
    expect(req.authzVersion).toBe(2);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("deve usar role 'user' e lista vazia quando payload não traz autorização", () => {
    req.headers = { authorization: "Bearer token" };
    const verify = vi.fn().mockReturnValue({ sub: "id-1" });
    const middleware = createAuthMiddleware(verify);

    middleware(req as Request, res as Response, next);

    expect(req.userId).toBe("id-1");
    expect(req.userRole).toBe("user");
    expect(req.userPermissions).toEqual([]);
    expect(next).toHaveBeenCalled();
  });

  it("deve retornar 401 quando payload tem sub vazio", () => {
    req.headers = { authorization: "Bearer token" };
    const verify = vi.fn().mockReturnValue({ sub: "" });
    const middleware = createAuthMiddleware(verify);

    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid token: missing subject",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("deve retornar 401 quando payload tem sub não-string", () => {
    req.headers = { authorization: "Bearer token" };
    const verify = vi.fn().mockReturnValue({ sub: 123 });
    const middleware = createAuthMiddleware(verify);

    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid token: missing subject",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("deve retornar 401 quando payload tem sub só espaços", () => {
    req.headers = { authorization: "Bearer token" };
    const verify = vi.fn().mockReturnValue({ sub: "   " });
    const middleware = createAuthMiddleware(verify);

    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid token: missing subject",
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("requireRole", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    next = vi.fn();
  });

  it("deve retornar 403 quando userRole não é a role exigida", () => {
    req.userRole = "user";
    const middleware = requireRole("admin");

    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
    expect(next).not.toHaveBeenCalled();
  });

  it("deve chamar next quando userRole é a role exigida", () => {
    req.userRole = "admin";
    const middleware = requireRole("admin");

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("permissions helpers", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { userPermissions: [] };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    next = vi.fn();
  });

  it("hasPermission deve retornar true quando permissão existe", () => {
    req.userPermissions = ["users.create"];
    expect(hasPermission(req as Request, "users.create")).toBe(true);
  });

  it("requirePermission deve retornar 403 quando permissão não existe", () => {
    const middleware = requirePermission("users.create");
    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("requireAnyPermission deve chamar next quando qualquer permissão existe", () => {
    req.userPermissions = ["users.read.self"];
    const middleware = requireAnyPermission(["users.create", "users.read.self"]);
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });
});

import { parse as parseCookie, serialize as serializeCookie } from "cookie";
import type { Request, Response } from "express";

export interface CookieSessionConfig {
  sessionCookieName: string;
  sessionMaxAgeSeconds: number;
}

export class CookieSessionService {
  constructor(private readonly config: CookieSessionConfig) {}

  readSessionToken(req: Request): string | null {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    const cookies = parseCookie(cookieHeader);
    const token = cookies[this.config.sessionCookieName];
    return typeof token === "string" && token.length > 0 ? token : null;
  }

  writeSessionCookie(res: Response, token: string, secure: boolean): void {
    res.append("Set-Cookie", serializeCookie(this.config.sessionCookieName, token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: this.config.sessionMaxAgeSeconds,
    }));
  }

  clearSessionCookie(res: Response, secure: boolean): void {
    res.append("Set-Cookie", serializeCookie(this.config.sessionCookieName, "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    }));
  }
}

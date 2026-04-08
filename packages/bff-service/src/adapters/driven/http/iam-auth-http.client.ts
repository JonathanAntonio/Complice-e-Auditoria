import { UpstreamHttpError } from "../../../application/errors/upstream-http.error";
import type { IIamAuthClient } from "../../../application/ports/iam-auth-client.port";
import type { OAuthAuthResponse, OAuthProvider } from "../../../domain/oauth";

export interface IamAuthHttpClientConfig {
  gatewayBaseUrl: string;
  iamAuthBasePath: string;
}

export class IamAuthHttpClient implements IIamAuthClient {
  constructor(private readonly config: IamAuthHttpClientConfig) {}

  async getAuthorizationUrl(provider: OAuthProvider, redirectUri: string): Promise<string> {
    const query = new URLSearchParams({ redirect_uri: redirectUri });
    const payload = await this.request<{ url: string }>(`/${provider}/url?${query.toString()}`);
    if (!payload || typeof payload.url !== "string" || payload.url.length === 0) {
      throw new Error("IAM OAuth authorization URL is invalid");
    }
    return payload.url;
  }

  async completeCallback(provider: OAuthProvider, code: string, state: string): Promise<OAuthAuthResponse> {
    const query = new URLSearchParams({ code, state });
    return this.request<OAuthAuthResponse>(`/${provider}/callback?${query.toString()}`);
  }

  async getCurrentUser(token: string): Promise<unknown> {
    return this.request<unknown>("/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async logout(token: string): Promise<void> {
    await this.request<null>("/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  private async request<T>(pathWithQuery: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    const response = await fetch(`${this.config.gatewayBaseUrl}${this.config.iamAuthBasePath}${pathWithQuery}`, {
      ...init,
      headers,
    });

    const payload = await parseHttpPayload(response);

    if (!response.ok) {
      throw new UpstreamHttpError(response.status, payloadMessage(payload, `IAM request failed (${response.status})`));
    }

    return payload as T;
  }
}

async function parseHttpPayload(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

function payloadMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const candidate = payload as { message?: unknown; error?: unknown };
    if (typeof candidate.message === "string" && candidate.message.length > 0) return candidate.message;
    if (typeof candidate.error === "string" && candidate.error.length > 0) return candidate.error;
  }
  if (typeof payload === "string" && payload.length > 0) return payload;
  return fallback;
}

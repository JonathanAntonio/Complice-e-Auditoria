import { UpstreamHttpError } from "../../../application/errors/upstream-http.error";
import type { IIamAuthClient } from "../../../application/ports/iam-auth-client.port";
import type { OAuthAuthResponse, OAuthProvider } from "../../../domain/oauth";
import type {
  AdminCreateUserInputDto,
  AdminUpdateUserRolesInputDto,
  AdminUpdateUserSecurityInputDto,
  AdminUsersListDto,
  AdminUsersQueryDto,
  AdminUserDto,
} from "../../../application/dtos/admin-user.dto";
import { parseAdminUserDto, parseAdminUsersListDto } from "../../../application/dtos/admin-user.dto";

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

  async listUsers(token: string, query: AdminUsersQueryDto): Promise<AdminUsersListDto> {
    const queryString = toQueryString(query);
    const payload = await this.requestUsers<unknown>(`/users${queryString ? `?${queryString}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return parseAdminUsersListDto(payload);
  }

  async getUserById(token: string, userId: string): Promise<AdminUserDto> {
    const payload = await this.requestUsers<unknown>(`/users/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return parseAdminUserDto(payload);
  }

  async createUser(token: string, input: AdminCreateUserInputDto): Promise<AdminUserDto> {
    const payload = await this.requestUsers<unknown>("/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    return parseAdminUserDto(payload);
  }

  async updateUserRoles(token: string, userId: string, input: AdminUpdateUserRolesInputDto): Promise<AdminUserDto> {
    const payload = await this.requestUsers<unknown>(`/users/${encodeURIComponent(userId)}/roles`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    return parseAdminUserDto(payload);
  }

  async updateUserSecurity(token: string, userId: string, input: AdminUpdateUserSecurityInputDto): Promise<AdminUserDto> {
    const payload = await this.requestUsers<unknown>(`/users/${encodeURIComponent(userId)}/security`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    return parseAdminUserDto(payload);
  }

  async deactivateUser(token: string, userId: string): Promise<AdminUserDto> {
    const payload = await this.requestUsers<unknown>(`/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return parseAdminUserDto(payload);
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

  private async requestUsers<T>(pathWithQuery: string, init: RequestInit = {}): Promise<T> {
    const usersBasePath = this.config.iamAuthBasePath.replace(/\/auth$/, "");
    const headers = new Headers(init.headers ?? {});
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    const response = await fetch(`${this.config.gatewayBaseUrl}${usersBasePath}${pathWithQuery}`, {
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

function toQueryString(query: AdminUsersQueryDto): string {
  const params = new URLSearchParams();
  if (query.page) params.set("page", `${query.page}`);
  if (query.pageSize) params.set("pageSize", `${query.pageSize}`);
  if (query.search) params.set("search", query.search);
  return params.toString();
}

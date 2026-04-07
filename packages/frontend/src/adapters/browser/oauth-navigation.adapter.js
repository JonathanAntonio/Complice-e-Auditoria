const BFF_AUTH_BASE = "/bff/auth";

export function startGoogleOAuth() {
  window.location.assign(`${BFF_AUTH_BASE}/google/start`);
}

export function startGithubOAuth() {
  window.location.assign(`${BFF_AUTH_BASE}/github/start`);
}

export function readAuthErrorFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return {
    authError: params.get("auth_error"),
    authProvider: params.get("auth_provider"),
  };
}

export function clearAuthErrorFromQuery() {
  const url = new URL(window.location.href);
  url.searchParams.delete("auth_error");
  url.searchParams.delete("auth_provider");
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, document.title, next);
}

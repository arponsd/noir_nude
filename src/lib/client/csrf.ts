/**
 * Client-side CSRF helper.
 *
 * Cross-lane note: client utilities usually live under `src/components/**`
 * owned by the frontend agent. This tiny read-only cookie reader is kept in
 * the security lane (`src/lib/client/`) because it pairs 1:1 with the
 * server-side double-submit flow in `src/lib/csrf/index.ts`. Any change to
 * the cookie name or encoding must be coordinated here and there together.
 *
 * Middleware issues the `csrf-token` cookie on every response. Frontend
 * fetch helpers should read the token via `getCsrfToken()` and attach it as
 * the `x-csrf-token` header on any non-GET request. The cookie is
 * deliberately NOT `httpOnly` so this reader can work; the double-submit
 * pattern compensates.
 */

const CSRF_COOKIE = "csrf-token";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const pattern = new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`);
  const match = document.cookie.match(pattern);
  if (!match || !match[1]) return null;
  return decodeURIComponent(match[1]);
}

export function getCsrfToken(): string | null {
  return readCookie(CSRF_COOKIE);
}

/**
 * Merge the CSRF header into a provided `HeadersInit`. Never overwrites a
 * header the caller already set explicitly — useful for opting a single
 * request out of CSRF when fetching cross-origin.
 */
export function withCsrfHeader(init: HeadersInit = {}): HeadersInit {
  const token = getCsrfToken();
  if (!token) return init;
  const headers = new Headers(init);
  if (!headers.has("x-csrf-token")) {
    headers.set("x-csrf-token", token);
  }
  return headers;
}

export const CSRF_HEADER_NAME = "x-csrf-token";
export const CSRF_COOKIE_NAME = CSRF_COOKIE;

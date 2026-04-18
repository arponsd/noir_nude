/**
 * Edge-runtime helpers for the CSRF module.
 *
 * `src/lib/csrf/index.ts` uses `node:crypto` which is unavailable in the Edge
 * Runtime that powers middleware. This file exposes a Web-Crypto-based
 * generator so middleware can mint a token value without reaching into Node.
 *
 * Cookie-writing is done by middleware directly via `NextResponse.cookies`,
 * so there is no `issue` function here.
 */

const CSRF_COOKIE = "csrf-token";
const CSRF_TOKEN_MAX_AGE_SECONDS = 24 * 60 * 60;

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i]!.toString(16).padStart(2, "0");
  }
  return out;
}

export function generateCsrfTokenEdge(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return toHex(buf);
}

export const CSRF_COOKIE_NAME_EDGE = CSRF_COOKIE;
export const CSRF_TOKEN_MAX_AGE_SECONDS_EDGE = CSRF_TOKEN_MAX_AGE_SECONDS;

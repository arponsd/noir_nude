import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ForbiddenError } from "@/lib/api/response";
import { ERROR_CODES } from "@/lib/constants";

const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const TOKEN_MAX_AGE_SECONDS = 24 * 60 * 60;

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function issueCsrfToken(): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const store = await cookies();
  store.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: isProd(),
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
  return token;
}

export async function getCsrfToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(CSRF_COOKIE)?.value;
}

/**
 * Compare two hex-encoded tokens in constant time. Returns `false` if either
 * is missing or the lengths differ so `timingSafeEqual` never throws.
 */
function tokensMatch(header: string | null, cookie: string | undefined): boolean {
  if (!header || !cookie) return false;
  if (header.length !== cookie.length) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(cookie);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Legacy entry point retained for callers that already import `verifyCsrf`.
 * Behaves identically to `requireCsrf` — the split is kept so a future Phase 8
 * migration can swap one for the other at individual routes without touching
 * every call site.
 */
export async function verifyCsrf(request: Request): Promise<void> {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return;
  const header = request.headers.get(CSRF_HEADER);
  const cookieToken = await getCsrfToken();
  if (!tokensMatch(header, cookieToken)) {
    // 403 matches the contract in docs/11-security.md (CSRF_FAILED → 403).
    throw new ForbiddenError("CSRF token mismatch", ERROR_CODES.CSRF_FAILED);
  }
}

/**
 * Opt-in CSRF enforcement for route handlers.
 *
 * Phase 7 softer path (T-7.S05): middleware issues/rotates the `csrf-token`
 * cookie on every response, so every authenticated client has a token ready.
 * Routes call `await requireCsrf(request)` at the top of their handler once
 * the frontend has been migrated to attach the `x-csrf-token` header. This
 * lets us roll enforcement out progressively without breaking existing
 * handlers that don't yet check.
 *
 * Server Actions are exempt per contract (Next 15 origin check handles them).
 */
export async function requireCsrf(request: Request): Promise<void> {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return;
  const header = request.headers.get(CSRF_HEADER);
  const cookieToken = await getCsrfToken();
  if (!tokensMatch(header, cookieToken)) {
    throw new ForbiddenError("CSRF token mismatch", ERROR_CODES.CSRF_FAILED);
  }
}

/**
 * Read-only helper: does the incoming request carry a matching token pair?
 * Useful for middleware logging of would-be-rejections without actually
 * blocking the request while enforcement is still opt-in.
 */
export async function hasValidCsrf(request: Request): Promise<boolean> {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return true;
  const header = request.headers.get(CSRF_HEADER);
  const cookieToken = await getCsrfToken();
  return tokensMatch(header, cookieToken);
}

/**
 * Generate a fresh token value without writing a cookie. Used by middleware
 * running in the Edge runtime, which does not have access to the
 * `next/headers` cookie API the same way route handlers do.
 */
export function generateCsrfTokenValue(): string {
  return randomBytes(32).toString("hex");
}

export const CSRF_COOKIE_NAME = CSRF_COOKIE;
export const CSRF_HEADER_NAME = CSRF_HEADER;
export const CSRF_TOKEN_MAX_AGE_SECONDS = TOKEN_MAX_AGE_SECONDS;

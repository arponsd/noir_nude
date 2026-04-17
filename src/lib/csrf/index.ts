import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { AuthError } from "@/lib/api/response";
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

export async function verifyCsrf(request: Request): Promise<void> {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return;

  const header = request.headers.get(CSRF_HEADER);
  const cookieToken = await getCsrfToken();

  if (!header || !cookieToken || header.length !== cookieToken.length) {
    throw new AuthError("CSRF token mismatch", ERROR_CODES.CSRF_FAILED);
  }
  const a = Buffer.from(header);
  const b = Buffer.from(cookieToken);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new AuthError("CSRF token mismatch", ERROR_CODES.CSRF_FAILED);
  }
}

export const CSRF_COOKIE_NAME = CSRF_COOKIE;
export const CSRF_HEADER_NAME = CSRF_HEADER;

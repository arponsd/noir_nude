import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/edge";
import type { UserRole } from "@/lib/constants";
import {
  CSRF_COOKIE_NAME_EDGE,
  CSRF_TOKEN_MAX_AGE_SECONDS_EDGE,
  generateCsrfTokenEdge,
} from "@/lib/csrf/edge";
import { buildCspReportOnly, NONCE_REQUEST_HEADER } from "@/lib/auth/security-headers";

// Phase 7 middleware responsibilities:
//   1. Route-level auth + role redirects (original behaviour).
//   2. Issue `csrf-token` cookie on every response so the frontend can
//      opt routes into CSRF enforcement via `requireCsrf()`.
//   3. Generate a per-request CSP nonce and forward it via the `x-nonce`
//      request header. The nonce is unused by the tightened report-only CSP
//      we ship today, but it unblocks Phase 8 flipping to enforced CSP
//      without touching every handler again.
//
// CSRF enforcement decision (T-7.S05): opt-in only. We do NOT reject
// mismatched tokens in middleware because many existing routes don't yet
// send `x-csrf-token`. Routes call `await requireCsrf(request)` once they're
// migrated. See docs/11-security.md §CSRF.

const ADMIN_ROLES: readonly UserRole[] = ["admin", "manager", "support"];

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

/** base64url-ish (strip padding) — 22+ alphanumeric chars from 16 random bytes. */
function generateNonce(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  let binary = "";
  for (let i = 0; i < buf.length; i += 1) binary += String.fromCharCode(buf[i]!);
  // `btoa` is available in the Edge runtime.
  return btoa(binary).replace(/=+$/u, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * Attach CSRF cookie + CSP headers + nonce propagation to a response.
 * Called on every branch that returns a response so the cookie and
 * security headers are applied uniformly.
 */
function decorate(req: NextRequest, res: NextResponse, nonce: string): NextResponse {
  // 1. Rotate/issue the csrf-token cookie if missing (do not replace an
  //    existing value — that would invalidate in-flight forms).
  const existing = req.cookies.get(CSRF_COOKIE_NAME_EDGE);
  if (!existing) {
    res.cookies.set(CSRF_COOKIE_NAME_EDGE, generateCsrfTokenEdge(), {
      httpOnly: false,
      secure: isProd(),
      sameSite: "lax",
      path: "/",
      maxAge: CSRF_TOKEN_MAX_AGE_SECONDS_EDGE,
    });
  }

  // 2. Publish the nonce on the response so `app/layout.tsx` can surface it
  //    on `<Script nonce={...}>` during the Phase 8 enforced-CSP flip.
  res.headers.set(NONCE_REQUEST_HEADER, nonce);

  // 3. Emit the tightened Content-Security-Policy-Report-Only from
  //    middleware. next.config.ts carries the same header as a fallback for
  //    paths outside the matcher (e.g. static asset prefetches).
  //    We intentionally keep the report-only header in prod — see
  //    buildCspReportOnly() documentation for the Phase 8 upgrade path.
  res.headers.set("Content-Security-Policy-Report-Only", buildCspReportOnly());

  return res;
}

export default auth((req) => {
  const nonce = generateNonce();

  // Forward the nonce to server components + route handlers via a request
  // header — the Next 15 recommended pattern is to rebuild the request when
  // mutating its headers. `NextResponse.next({ request: { headers } })`
  // re-emits the request with our `x-nonce` added.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(NONCE_REQUEST_HEADER, nonce);

  const { nextUrl } = req;
  const isAdmin = nextUrl.pathname.startsWith("/admin");
  const isAccount = nextUrl.pathname.startsWith("/account");
  const isCheckout = nextUrl.pathname === "/checkout";

  // Non-gated paths still need CSRF cookie issuance + CSP header + nonce.
  if (!isAdmin && !isAccount && !isCheckout) {
    const pass = NextResponse.next({ request: { headers: requestHeaders } });
    return decorate(req, pass, nonce);
  }

  const session = req.auth;
  if (!session || !session.user) {
    const loginUrl = new URL("/login", nextUrl);
    const nextPath = nextUrl.pathname + nextUrl.search;
    loginUrl.searchParams.set("next", nextPath);
    const redirect = NextResponse.redirect(loginUrl);
    return decorate(req, redirect, nonce);
  }

  if (isAdmin) {
    const role = session.user.role;
    if (!ADMIN_ROLES.includes(role)) {
      const forbidden = new URL("/403", nextUrl);
      const rewrite = NextResponse.rewrite(forbidden);
      return decorate(req, rewrite, nonce);
    }
  }

  const allow = NextResponse.next({ request: { headers: requestHeaders } });
  return decorate(req, allow, nonce);
});

// The matcher now covers the full app surface so the CSRF cookie + CSP
// header + nonce are injected uniformly. Static assets (`_next/static`,
// images, favicon) are excluded to keep middleware off the hot path. The
// previous role-gate paths are still handled by the logic inside the auth
// callback above.
export const config = {
  matcher: [
    // Run on everything except:
    //   - Next internal bundles (_next/static, _next/image)
    //   - Common static asset extensions
    //   - The Next.js dev hot-reload WebSocket
    //   - Favicons/robots/sitemap (served as plain files)
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|css|js|map|txt|woff2?|ttf|eot)).*)",
  ],
};

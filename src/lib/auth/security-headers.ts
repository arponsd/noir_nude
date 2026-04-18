/**
 * Content Security Policy builders.
 *
 * Decision (Phase 7 — T-7.S01/S04):
 * --------------------------------
 * We ship a **tightened Content-Security-Policy-Report-Only** in every
 * environment (dev, preview, and prod). Full enforced CSP with per-request
 * nonces is deferred to Phase 8 for the reasons below.
 *
 * Why report-only-even-in-prod, not nonce-enforced:
 *   - Next.js 15 emits a non-trivial number of inline scripts for hydration
 *     + `next/script` helpers. A strict-dynamic + nonce policy requires every
 *     `<Script>` tag in the app tree to read the nonce from `headers()` and
 *     forward it. Several third-party widgets (PostHog, Sentry) inject their
 *     own script elements that don't see our nonce context.
 *   - A strict CSP that breaks hydration is worse than a tightened
 *     report-only policy that surfaces violations. The report-only channel
 *     feeds `/api/csp-report` and we treat it as a triage queue.
 *   - The next.config header block already layers Strict-Transport-Security,
 *     X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy,
 *     Permissions-Policy. CSP is defence-in-depth.
 *
 * What we DID tighten vs the previous static string in next.config:
 *   - Added `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`,
 *     `frame-ancestors 'none'` (XFO redundant but belt-and-braces).
 *   - Kept `'unsafe-inline'` for scripts because Next.js hydration needs it
 *     in report-only mode. The report-only header makes these visible.
 *   - `connect-src` explicitly allowlists Sentry + PostHog ingest hosts.
 *
 * How to flip to enforced in Phase 8:
 *   - Use `buildCspForProduction(nonce)` — it returns a CSP string that
 *     removes `'unsafe-inline'` from script-src and substitutes
 *     `'nonce-<nonce>' 'strict-dynamic'`. The middleware already generates a
 *     base64url nonce per request and forwards it to route handlers via the
 *     `x-nonce` request header. Layout can read `headers().get('x-nonce')`
 *     and pass to `<Script nonce={...}>`.
 *   - Flip the header name from `Content-Security-Policy-Report-Only` to
 *     `Content-Security-Policy` once Next's bundled inline scripts carry the
 *     nonce and the CSP-report queue is quiet for a week.
 *
 * The `/api/csp-report` endpoint is preserved in both modes.
 */

const BASE_DIRECTIVES = [
  "default-src 'self'",
  "img-src 'self' res.cloudinary.com images.unsplash.com data:",
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  "font-src 'self' fonts.gstatic.com",
  "connect-src 'self' *.sentry.io *.posthog.com *.ingest.sentry.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "report-uri /api/csp-report",
] as const;

/**
 * Tightened report-only CSP. Kept `'unsafe-inline'` on script-src so Next.js
 * hydration doesn't break while we observe violations via `/api/csp-report`.
 * Served with the `Content-Security-Policy-Report-Only` header.
 */
export function buildCspReportOnly(): string {
  return [...BASE_DIRECTIVES, "script-src 'self' 'unsafe-inline'"].join("; ");
}

/**
 * Enforced CSP string using a per-request nonce + `strict-dynamic`. NOT
 * currently wired into the response header — kept for the Phase 8 migration.
 * `strict-dynamic` lets a nonced script load further scripts without
 * extending the allowlist, which matches how Next.js emits chunked bundles.
 */
export function buildCspForProduction(nonce: string): string {
  return [...BASE_DIRECTIVES, `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`].join("; ");
}

/**
 * Legacy constant still referenced by `next.config.ts`. We keep the static
 * report-only string here so the nextConfig `headers()` block continues to
 * set the CSP for any request that somehow bypasses middleware (e.g.
 * static asset routes outside the matcher). Middleware overrides this on
 * matched paths with the same string today, but the pattern lets Phase 8
 * swap in the nonce-bearing header exclusively in middleware without the
 * config-level fallback disappearing.
 */
export const CONTENT_SECURITY_POLICY = buildCspReportOnly();

export const CSP_REPORT_ONLY_HEADER = {
  key: "Content-Security-Policy-Report-Only",
  value: CONTENT_SECURITY_POLICY,
} as const;

/**
 * Exposed for next.config.ts. We intentionally list only the CSP report-only
 * entry here — the other security headers are declared inline in
 * next.config so devops can audit the whole block in one place.
 */
export const SECURITY_HEADERS_ADDITIONS = [CSP_REPORT_ONLY_HEADER] as const;

/**
 * Header name used by middleware when forwarding a freshly minted nonce to
 * route handlers and server components.
 */
export const NONCE_REQUEST_HEADER = "x-nonce";

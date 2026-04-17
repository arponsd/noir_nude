// Orchestrator ASK: wire these headers into `next.config.ts` under `headers()`.
// The `devops` agent owns `next.config.ts`, so the security agent exports the
// constants here and leaves the integration to that lane.

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "img-src 'self' res.cloudinary.com images.unsplash.com data:",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  "font-src 'self' fonts.gstatic.com",
  "connect-src 'self' *.sentry.io *.posthog.com *.ingest.sentry.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "report-uri /api/csp-report",
].join("; ");

export const CSP_REPORT_ONLY_HEADER = {
  key: "Content-Security-Policy-Report-Only",
  value: CONTENT_SECURITY_POLICY,
} as const;

// Full bundle of additional headers to merge into next.config.ts `securityHeaders`.
// HSTS/X-Frame/X-Content-Type/Referrer-Policy/Permissions-Policy are already set there;
// this only exposes the CSP-report-only entry the devops agent should append.
export const SECURITY_HEADERS_ADDITIONS = [CSP_REPORT_ONLY_HEADER] as const;

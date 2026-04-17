# 11 — Security

Owner: `security` agent. Reviewed by `qa` and `devops` before each release.

## Authentication

- Bcrypt 12 rounds. Reject passwords <10 chars. Reject top-1000 common passwords (`zxcvbn` score ≥ 3).
- Optional breach check via HIBP password range API (k-anonymity model) — soft warning, not blocking.
- Email verification required before checkout.
- Session: NextAuth JWT, 7-day rolling expiry, refreshed on every authenticated request.
- Logout invalidates session on the client; JWT revocation list in Redis for forced logout (admin or password change).
- Password reset tokens: random 32 bytes, hashed at rest, 1-hour expiry, single-use.
- Email verification tokens: random 32 bytes, hashed at rest, 24-hour expiry.

## Authorization

- `requireRole(roles)` helper at the entry of every protected handler/action.
- Middleware redirects unauthenticated requests to `/login?next=<path>`.
- Admin routes check role server-side on every render — never trust client-side role.
- Direct object reference checks: every order/address/cart fetch verifies `userId` matches session, even on `:id` lookups.

## Cookies

- Session: `httpOnly`, `secure`, `sameSite=lax`, `__Secure-` prefix.
- CSRF: `secure`, `sameSite=lax`, NOT `httpOnly` (must be readable by JS to mirror to header).
- No third-party cookies. No tracking pixels until consent banner ships.

## CSRF

- Double-submit cookie pattern.
- `src/lib/csrf/issue.ts` issues per-session token.
- Middleware compares header vs cookie on every non-GET, non-Server-Action route.
- Server Actions rely on Next 15 origin check.

## Rate limiting

See `docs/04-contracts.md` for limits. Implementation in `src/lib/rate-limit/` using Upstash sliding window. Failed limit returns `429` with `Retry-After`.

## Input validation

- Zod at every boundary. No exceptions.
- Strip unknown fields (`.strict()` in Zod schemas where appropriate).
- ObjectId validation: reject malformed IDs at the schema level, never let them reach Mongoose.
- HTML sanitization on review body / blog body via `sanitize-html` with an allowlist (b, i, p, br, ul, ol, li, a — no script/style/iframe).

## File uploads

- Cloudinary signed uploads only.
- Server validates returned URL points to our Cloudinary cloud before storing.
- Max 5 MB per image. Max 10 MB per video (post-MVP).
- MIME allowlist: jpeg, png, webp, avif. Cloudinary auto-strips EXIF.

## Headers

Set in `next.config.ts`:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; img-src 'self' res.cloudinary.com data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; connect-src 'self' *.sentry.io *.posthog.com
```

CSP `unsafe-inline` for scripts is temporary — tighten with nonces during Phase 7.

## Secrets

- All secrets via env vars. Never committed.
- `.env.local` for dev only; `.env.example` lists required keys with no values.
- Vercel env vars set per environment; preview env values come from a separate Atlas/Upstash project, never production.
- Rotate Resend, Cloudinary, Upstash keys quarterly; track in `docs/postmortems/secrets-rotation.md`.

## PII + GDPR

- User can export all their data via `GET /api/user/export` → JSON download.
- User can delete account via `DELETE /api/user` — cascades carts, wishlists, addresses, anonymizes orders (keeps for accounting), removes reviews.
- No PII in logs. Logger redacts `email`, `phone`, `password`, `token`, `address` fields automatically.
- Audit log captures admin actions in `ActivityLog` collection.

## Money + checkout

- All price math server-side. Client-shown totals are display-only and re-computed on submit.
- Coupon usage atomic via Mongoose transaction.
- Stock decrement and order create atomic.

## Dependency hygiene

- `pnpm audit` runs in CI; high/critical fail the build.
- Renovate (or Dependabot) PRs weekly.
- Lock file committed.

## Pre-launch checklist

- [ ] All routes have Zod validation.
- [ ] All admin routes have role guard.
- [ ] CSP report-only run for 1 week, then enforced.
- [ ] Penetration test (manual or automated) on auth + checkout.
- [ ] Sentry source maps uploaded but JS source maps NOT served publicly.
- [ ] Backups verified (restore drill).
- [ ] Privacy policy + cookie banner shipped.

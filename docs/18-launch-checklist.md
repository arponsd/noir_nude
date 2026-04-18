# 18 — Launch Checklist

Mirrors the launch section of `docs/runbook.md` in a copy-to-issue form. Duplicate this into a dated file (`docs/postmortems/launch-YYYY-MM-DD.md`) before cutting the first production deploy.

## Code & CI

- [ ] `pnpm typecheck` green on `main`
- [ ] `pnpm lint` green on `main`
- [ ] `pnpm test:unit` green
- [ ] `pnpm test:integration` green (`test:integration:ci` if flaky)
- [ ] `pnpm test:e2e:smoke` green against preview
- [ ] `pnpm build` succeeds; shared JS < 180 KB gz
- [ ] `pnpm audit --audit-level=high` clean
- [ ] Gitleaks scan clean

## Infrastructure

- [ ] Atlas M10+ with replica set
- [ ] Atlas backups enabled (daily, 7-day retention)
- [ ] Atlas Network Access restricted
- [ ] Upstash Redis production instance
- [ ] Cloudinary prod env + signed preset
- [ ] Resend domain verified; SPF/DKIM/DMARC ≥ 9/10 on mail-tester
- [ ] Sentry project + DSN + source maps
- [ ] PostHog project + key

## Domain & SSL

- [ ] Apex + `www` on Vercel
- [ ] HTTPS + HSTS
- [ ] `www` → apex redirect

## Env vars (Vercel production)

- [ ] `MONGODB_URI`, `MONGODB_DB`
- [ ] `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- [ ] `GOOGLE_CLIENT_ID`/`_SECRET`
- [ ] `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`
- [ ] `CLOUDINARY_CLOUD_NAME`/`_API_KEY`/`_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- [ ] `UPSTASH_REDIS_REST_URL`/`_TOKEN`
- [ ] `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- [ ] `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- [ ] `CRON_SECRET`

## Data

- [ ] Production seed (admins + categories + launch products)
- [ ] Admin bootstrap password rotated
- [ ] Test users flagged `isTest:true`

## Security

- [ ] CSP enforced (or tightened report-only)
- [ ] Rate limiters live against Upstash
- [ ] CSRF cookie issued + `requireCsrf` on mutating routes
- [ ] Pen-test findings resolved
- [ ] HIBP advisory wired
- [ ] All admin routes call `requireRole`

## Legal & UX

- [ ] `/privacy-policy`, `/terms`, `/faq`, `/about`, `/contact` published
- [ ] Consent banner ships; PostHog gated on consent
- [ ] Lighthouse perf ≥ 90 (homepage, PDP)
- [ ] Lighthouse a11y ≥ 95
- [ ] Playwright `@full` green on staging
- [ ] `@admin-a11y` green

## Observability

- [ ] Sentry production event confirmed
- [ ] PostHog funnel dashboard created
- [ ] Error-rate alert to `#alerts`
- [ ] Atlas slow-query + Upstash quota alerts

## Operations

- [ ] Runbook reviewed by on-call
- [ ] Atlas restore drill (last 90 days)
- [ ] Load test: 100 RPS checkout, 5 min, <1 % errors
- [ ] Postmortem template in `docs/postmortems/_template.md`
- [ ] Rollback drill executed

Ready when every box is ticked.

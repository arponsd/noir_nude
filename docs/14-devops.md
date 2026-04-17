# 14 — DevOps

## Deployment

- **Hosting:** Vercel (Next.js native).
- **DB:** MongoDB Atlas, M0 in dev, M10+ in prod (replica set required for transactions).
- **Cache / rate limit:** Upstash Redis (serverless-friendly).
- **Images:** Cloudinary.
- **Email:** Resend.
- **Monitoring:** Sentry, PostHog.

## Environments

| Env        | Branch    | URL pattern        | DB                        | Notes                   |
| ---------- | --------- | ------------------ | ------------------------- | ----------------------- |
| local      | feature   | localhost:3000     | local Atlas project       | seeded data             |
| preview    | any PR    | `<sha>.vercel.app` | shared `cosmetic_preview` | reset weekly            |
| staging    | `develop` | `staging.<domain>` | `cosmetic_staging`        | mirrors prod data shape |
| production | `main`    | `<domain>`         | `cosmetic_prod`           | nightly backups         |

## CI (GitHub Actions)

Workflow: `.github/workflows/ci.yml`

```
on: push, pull_request
jobs:
  install:    pnpm install --frozen-lockfile (cached)
  typecheck:  pnpm typecheck
  lint:       pnpm lint
  unit:       pnpm test:unit --coverage
  integration:pnpm test:integration  (with mongo + redis services)
  e2e-smoke:  pnpm test:e2e:smoke    (preview deploy)
  bundle:     next-bundle-analyzer, comment delta on PR
  audit:      pnpm audit --audit-level=high
```

Required checks for merge: typecheck, lint, unit, integration. e2e-smoke required for `develop`/`main`.

## CD

- Push to `main` → Vercel production deploy.
- Push to `develop` → Vercel staging deploy.
- PR open → Vercel preview deploy with isolated env vars.
- Sentry release created via `@sentry/cli` in Vercel build hook; source maps uploaded.

## Cron jobs

Vercel Cron schedule in `vercel.json`:

| Job                             | Schedule         | Endpoint                         |
| ------------------------------- | ---------------- | -------------------------------- |
| Abandoned cart sweep (post-MVP) | hourly           | `POST /api/cron/abandoned-cart`  |
| Back-in-stock notifier          | every 30m        | `POST /api/cron/back-in-stock`   |
| Coupon expiry cleanup           | daily 02:00      | `POST /api/cron/coupons-cleanup` |
| Sales report email (admin)      | weekly Mon 08:00 | `POST /api/cron/weekly-report`   |

All cron endpoints check `Authorization: Bearer <CRON_SECRET>` header set by Vercel.

## Backups

- Atlas: continuous backups (M10+), 7-day point-in-time restore.
- Cloudinary: native versioning, no extra config.
- Restore drill: quarterly, documented in `docs/postmortems/restore-drill-<YYYY-Qn>.md`.

## Monitoring & alerts

- **Sentry:** error rate alert at >5/min. Slack webhook to `#alerts`.
- **PostHog:** funnel for checkout — alert if conversion drops >20% week-over-week.
- **Vercel:** deployment failure → Slack.
- **Atlas:** connection saturation, slow query (>500ms) alerts.
- **Upstash:** quota usage >80% alert.

## Performance budget

- Initial JS payload < 180 KB gzipped.
- LCP < 2.5s on 4G.
- CLS < 0.1.
- INP < 200ms.

CI fails the bundle check if a PR exceeds budget.

## Logging

- Server logs go to Vercel (stdout) + Sentry breadcrumbs.
- Structured JSON logs via `pino` in `src/lib/utils/logger.ts`.
- Levels: `debug` (dev only), `info`, `warn`, `error`.
- PII redaction in logger config.

## Runbook

`docs/runbook.md` (created Phase 7) covers:

- How to roll back a deploy
- How to flip a feature flag
- How to drain a stuck queue
- How to restore from backup
- On-call escalation path

## Domain & DNS

- Apex + `www` redirect to apex.
- TLS via Vercel (auto).
- Email DNS: Resend SPF + DKIM + DMARC required before launch.

## Cost ceilings (alert at 80%)

- Vercel: $20/mo Hobby until traffic warrants Pro
- Atlas: $0 until M10
- Upstash: free tier
- Cloudinary: free tier (25 GB / 25 GB bandwidth)
- Resend: 3000/mo free
- Sentry: 5k events/mo free
- PostHog: 1M events/mo free

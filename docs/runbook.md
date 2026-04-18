# Production Runbook

Living operational guide. Updated as incidents and drills happen.

## Quick links

- **Vercel dashboard:** https://vercel.com/<team>/cosmetic
- **MongoDB Atlas:** https://cloud.mongodb.com/v2/<project>
- **Upstash Redis:** https://console.upstash.com
- **Cloudinary:** https://cloudinary.com/console
- **Resend:** https://resend.com/overview
- **Sentry:** https://sentry.io/organizations/<org>/projects/cosmetic
- **PostHog:** https://app.posthog.com/project/<id>
- **Status page (manual):** docs/incidents/

## On-call

| Rotation | Primary | Secondary |
| -------- | ------- | --------- |
| Weekday  | TBD     | TBD       |
| Weekend  | TBD     | TBD       |

Escalation path: primary → secondary → eng lead → founder. Pager channel: Slack `#oncall`.

---

## Common runbooks

### 1. Rollback a production deploy

**When:** new deploy is broken, user-visible, unrecoverable via toggle.

1. Open Vercel dashboard → Deployments.
2. Find the last green deploy on `main`. Click **⋯ → Promote to Production**.
3. Confirm the alias swap. Traffic swings in ≤10 seconds.
4. Open a postmortem: `docs/postmortems/YYYY-MM-DD-<slug>.md`. Copy the template.
5. `git revert <sha>` on `main` to keep history consistent; push, merge.

### 2. Restore from backup

**When:** data loss, corruption, or a disastrous migration.

1. Atlas → Clusters → Backup → **Point in time**. Pick the last good timestamp.
2. Choose **Restore into new cluster** (never overwrite prod). Name `cosmetic-restore-YYYYMMDD`.
3. Wait for provisioning (5–15 min).
4. Once ready, update Vercel env `MONGODB_URI` for production to the new cluster string. Redeploy.
5. After validation, archive the old cluster (don't delete for 30 days).
6. Document the incident.

Drill this quarterly. Last drill: TBD.

### 3. Rotate a secret

**When:** credential leaked, contractor offboarded, scheduled rotation.

1. Issue new credential on the provider (Atlas DB user, Upstash token, Cloudinary API secret, Resend key, NextAuth secret, OAuth client secret).
2. `vercel env rm <KEY> production` then `vercel env add <KEY> production` — paste new value.
3. Trigger redeploy: `vercel deploy --prod`.
4. Revoke old credential on provider.
5. Log rotation in `docs/postmortems/secrets-rotation.md` with date + rotator.

### 4. Flip a feature flag

Flags live in `src/lib/env.ts` as `ENABLE_*` booleans. Today:

- `ENABLE_REVIEWS`
- `ENABLE_WISHLIST`
- `ENABLE_LOYALTY` (post-MVP)

Flip via Vercel env + redeploy. No runtime flag store yet — roadmap item for Phase 8.

### 5. Drain a stuck queue / cron

We have no background queue yet. Vercel Cron jobs are listed in `vercel.json`. If a cron is firing too often or misbehaves:

1. `vercel crons list`
2. Remove from `vercel.json`, commit, redeploy.
3. Investigate the underlying handler.

### 6. Rate limit misfire (customers locked out)

**Symptom:** support reports "I can't log in / checkout". HTTP 429s in Sentry.

1. Verify Upstash health: console.upstash.com → Data Browser — query any key.
2. If Upstash is down, the in-memory shim takes over but is per-instance. Serverless → this means random users are limited. **Temporary mitigation:** raise the limit in `src/lib/rate-limit/index.ts` and redeploy, OR scale Vercel function memory to force instance pinning (not reliable).
3. Log the incident, rotate limits back after Upstash recovers.

### 7. Payment provider down

N/A — we run COD only. If an order is placed and the customer wants to pay online, direct to support.

### 8. Email delivery failure

**Symptom:** Resend bounce rate spikes in dashboard or customers report missing order confirmations.

1. Check Resend dashboard for suspended domain or quota hit.
2. Validate SPF/DKIM/DMARC DNS records:
   ```
   dig TXT example.com       # SPF
   dig TXT resend._domainkey.example.com   # DKIM
   dig TXT _dmarc.example.com              # DMARC
   ```
3. Check API key validity.
4. Temporary: downgrade sender to a verified fallback. Log incident.

### 9. Sentry flood (alert fatigue)

If errors spike:

1. Open the top issue in Sentry. Read the stack.
2. Is it a deploy regression? → rollback (runbook 1).
3. Is it a third-party outage (Cloudinary, Upstash)? → status page check, incident banner on site.
4. Mute the alert channel for 30 minutes while you work. Re-enable explicitly.

---

## Launch checklist (one-time, Phase 7 gate)

Copy to `docs/postmortems/launch-YYYY-MM-DD.md` and tick as you go.

### Code & CI

- [ ] `pnpm typecheck` green on `main`
- [ ] `pnpm lint` green on `main`
- [ ] `pnpm test:unit` green
- [ ] `pnpm test:integration` green (run with `--no-file-parallelism` if flaky)
- [ ] `pnpm test:e2e:smoke` green against preview
- [ ] `pnpm build` succeeds; shared JS < 180 KB gzipped
- [ ] `pnpm audit --audit-level=high` clean
- [ ] Gitleaks scan clean

### Infrastructure

- [ ] Atlas cluster M10+ with replica set
- [ ] Atlas backups enabled (daily, 7-day retention)
- [ ] Atlas Network Access restricted to Vercel IPs + dev IP list
- [ ] Upstash Redis production instance provisioned
- [ ] Cloudinary prod environment + signed upload preset
- [ ] Resend domain verified; SPF/DKIM/DMARC pass `mail-tester.com` ≥ 9/10
- [ ] Sentry project created, DSN set, source maps upload verified
- [ ] PostHog project created, key set, dev events filtered out

### Domain & SSL

- [ ] Apex + `www` configured in Vercel
- [ ] HTTPS enforced, HSTS preload pending (once DNS is stable for 30 days)
- [ ] `www` redirects to apex

### Env vars (Vercel → production scope)

- [ ] `MONGODB_URI`, `MONGODB_DB`
- [ ] `NEXTAUTH_SECRET` (32+ bytes), `NEXTAUTH_URL`
- [ ] `GOOGLE_CLIENT_ID` / `_SECRET` (production credentials, distinct from dev)
- [ ] `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`
- [ ] `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- [ ] `UPSTASH_REDIS_REST_URL` / `_TOKEN`
- [ ] `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- [ ] `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- [ ] `CRON_SECRET`

### Data

- [ ] Production seed run (admins + categories + a launch product set)
- [ ] Admin bootstrap password rotated away from seed default
- [ ] Test users marked `isTest:true` so admin dashboards stay clean

### Security

- [ ] CSP enforced in production (or tightened report-only with alerting) — see `src/lib/auth/security-headers.ts`
- [ ] Rate limiters confirmed with real Upstash
- [ ] CSRF cookie issued on GET; route-level `requireCsrf` enabled on mutating handlers
- [ ] Penetration-test findings resolved or accepted with rationale in `docs/postmortems/pentest-YYYY-MM-DD.md`
- [ ] Password strength gate + HIBP advisory tested
- [ ] All admin routes verified `requireRole` active

### Legal & UX

- [ ] `/privacy-policy`, `/terms`, `/faq`, `/about`, `/contact` published
- [ ] Cookie consent banner ships, PostHog gated on consent
- [ ] Lighthouse perf ≥ 90 on homepage + PDP
- [ ] Lighthouse a11y ≥ 95 on all customer-facing pages
- [ ] Playwright `@full` suite green against staging
- [ ] `@admin-a11y` suite green

### Observability

- [ ] Sentry receiving events from production (trigger a test error)
- [ ] PostHog dashboard created with conversion funnel
- [ ] Error-rate alert set (Slack channel `#alerts`)
- [ ] Slow-query alerts on Atlas
- [ ] Upstash quota alert at 80 %

### Operations

- [ ] This runbook reviewed by on-call rotation
- [ ] Atlas restore drill executed (latest within 90 days)
- [ ] Load test run: 100 RPS checkout sustained 5 min, error rate < 1 %
- [ ] Incident template in `docs/postmortems/_template.md`
- [ ] Rollback drill executed

---

## Known issues / follow-ups tracked as post-launch

- CSP nonce integration (Next.js hydration scripts) — ship in Phase 8 once bundle tags are confirmed compatible.
- Integration test parallelism flakes on low-memory hosts. CI uses `test:integration:ci` (`--no-file-parallelism`).
- `/admin/roles` page is MVP placeholder — role assignment UI is security-lane follow-up.
- Invoice PDF is a text stub; swap to `pdfkit` or Puppeteer in Phase 8.
- AuthToken model lives under `src/lib/auth/token-store.ts` — relocate into `src/lib/db/models/` once database agent has capacity.

## Postmortem template

See `docs/postmortems/_template.md`.

## Change log

- YYYY-MM-DD — initial runbook (Phase 7 gate)

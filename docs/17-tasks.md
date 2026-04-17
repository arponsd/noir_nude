# 17 — Task Backlog

Durable backlog. Every task here is ready to become a GitHub issue (template: `.github/ISSUE_TEMPLATE/task.md`) and a branch.

## Legend

Task ID: `T-<phase>.<lane><seq>`
Lanes: **F** frontend · **B** backend · **D** database · **S** security · **O** devops · **Q** qa

Deps: comma-separated task IDs. Empty = no blocker.

All tasks inherit: Zod validation at boundaries, typecheck/lint/unit must pass, PR template complete, stay in lane.

---

## Phase 0 — Docs & contracts ✅

Complete. Artifacts: `CLAUDE.md`, `docs/01-16*.md`, `.claude/agents/*.md`, `.github/**`, `.husky/**`, commit/lint configs. User sign-off on `docs/10-mvp-scope.md` is the gate to start Phase 1.

---

## Phase 1 — Foundation (weeks 1–3)

### DevOps

| ID      | Task                                                                                   | Deps    | Acceptance                                                                    |
| ------- | -------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| T-1.O01 | Scaffold Next.js 15 + TS strict + App Router                                           | —       | `pnpm dev` serves; `pnpm typecheck`/`lint`/`build` green; path alias `@/` set |
| T-1.O02 | Install core deps (shadcn, tailwind, tanstack, zustand, mongoose, next-auth, zod, RHF) | T-1.O01 | lockfile committed; bundle <180KB gz empty shell                              |
| T-1.O03 | Wire Husky + commitlint + lint-staged                                                  | T-1.O01 | Hooks fire locally; bad commit message rejected                               |
| T-1.O04 | `src/lib/env.ts` Zod parser; boot fails on missing required vars                       | T-1.O01 | Unit test covers missing + malformed env                                      |
| T-1.O05 | GitHub Actions CI wired to real pnpm scripts                                           | T-1.O01 | All required checks green on first PR                                         |
| T-1.O06 | Sentry init in `instrumentation.ts` + source maps upload                               | T-1.O01 | Preview deploy event appears in Sentry                                        |
| T-1.O07 | PostHog client-side init (opt-in respects consent)                                     | T-1.O01 | Events flow in staging PostHog project                                        |
| T-1.O08 | Vercel project linked; 3 envs (local/preview/prod) with isolated secrets               | T-1.O01 | Preview URL deploys per PR; prod gated on main                                |
| T-1.O09 | Atlas cluster provisioned (dev + prod), replica set for transactions                   | —       | Connection strings in Vercel env; dev seed works                              |
| T-1.O10 | Upstash Redis project + env                                                            | —       | Rate-limit smoke test passes                                                  |
| T-1.O11 | Cloudinary account + signed-upload preset                                              | —       | `pnpm tsx scripts/cloudinary-sign-smoke.ts` returns valid signature           |

### Database

| ID      | Task                                                          | Deps                      | Acceptance                                                                |
| ------- | ------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------- |
| T-1.D01 | `src/lib/db/connect.ts` Mongoose singleton with dev HMR guard | T-1.O01, T-1.O09          | No "MongooseError: OverwriteModel" on hot reload                          |
| T-1.D02 | Base `User` model + indexes + tests                           | T-1.D01                   | unique email, role enum, timestamps, soft-delete; integration test passes |
| T-1.D03 | `Category` model + tree depth validator                       | T-1.D01                   | unique slug, parent ref, depth ≤ 2                                        |
| T-1.D04 | `Product` + variant subdoc + text index + compound indexes    | T-1.D01                   | schema covers all fields in `docs/05`; indexes explain plan verified      |
| T-1.D05 | Seed script skeleton (users + categories + products)          | T-1.D02, T-1.D03, T-1.D04 | `pnpm db:seed` runs idempotently on clean + seeded DB                     |
| T-1.D06 | Migration harness + `migrations` collection tracker           | T-1.D01                   | `pnpm db:migrate` no-ops when up to date                                  |

### Security

| ID      | Task                                                                        | Deps             | Acceptance                                                               |
| ------- | --------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------ |
| T-1.S01 | NextAuth v5 config (Credentials + Google) with JWT session                  | T-1.D02          | `/api/auth/[...nextauth]` responds; session cookie attrs match `docs/04` |
| T-1.S02 | `requireRole()` helper + `auth()` wrapper                                   | T-1.S01          | Unit tests: denies unauth, denies wrong role, allows right role          |
| T-1.S03 | `src/middleware.ts`: auth redirect + role gate + rate-limit plumbing        | T-1.S01, T-1.S06 | Unauth `/account/*` → `/login?next=`; perf <5ms added                    |
| T-1.S04 | Password hashing (`bcryptjs`, 12 rounds) + complexity validator (zxcvbn ≥3) | T-1.D02          | Unit tests on edge-case passwords                                        |
| T-1.S05 | Email verification + password reset token services                          | T-1.D02          | Tokens hashed at rest, single-use, expiry enforced                       |
| T-1.S06 | Rate-limit helpers (Upstash sliding window) per contract table              | T-1.O10          | 429 returned; headers include `Retry-After`                              |
| T-1.S07 | CSRF double-submit issuer + middleware check                                | T-1.S03          | Missing/mismatch token → 403; GET exempt                                 |
| T-1.S08 | Security headers in `next.config.ts` (CSP report-only initially)            | T-1.O01          | CSP violations land in Sentry                                            |

### Backend

| ID      | Task                                                                | Deps                      | Acceptance                                                      |
| ------- | ------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------- |
| T-1.B01 | `ApiResponse<T>` envelope + `safeRoute()` / `safeAction()` wrappers | T-1.O01                   | Unit tests: throws wrapped into error envelope, Sentry captured |
| T-1.B02 | `ERROR_CODES` constants                                             | T-1.B01                   | No raw error strings in handlers (lint rule or review)          |
| T-1.B03 | `logger.ts` with PII redaction                                      | T-1.O01                   | Redacts email/phone/password/token in captured output           |
| T-1.B04 | Register / login / forgot / reset / verify endpoints                | T-1.S01, T-1.S04, T-1.S05 | Integration tests cover happy + 4 failure paths each            |

### Frontend

| ID      | Task                                                                            | Deps    | Acceptance                                             |
| ------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------------ |
| T-1.F01 | Design tokens in `tailwind.config.ts` + `globals.css` vars                      | T-1.O02 | Token grid renders on `/_design` internal route        |
| T-1.F02 | Fonts (Fraunces + Inter) via `next/font`                                        | T-1.O01 | No layout shift; woff2 subset verified                 |
| T-1.F03 | shadcn/ui primitives installed + restyled (Button, Input, Select, Sheet, Toast) | T-1.F01 | Storybook-less visual smoke via `/_design`             |
| T-1.F04 | Root layout: Header, Footer, Providers (Auth, Query, Toaster)                   | T-1.S01 | Server components by default; client only where needed |
| T-1.F05 | Auth pages: login, register, forgot, reset, verify                              | T-1.B04 | RHF + Zod; a11y clean; happy path e2e (placeholder)    |
| T-1.F06 | Account shell: `/account/*` layout with sidebar + guard                         | T-1.S03 | Unauth redirects; role-aware nav                       |
| T-1.F07 | Admin shell: `/admin/*` layout with role redirect                               | T-1.S03 | Customer lands on 403, admin sees shell                |
| T-1.F08 | 404, error, loading UI                                                          | T-1.F01 | Every top-level segment has them                       |

### QA

| ID      | Task                                                    | Deps    | Acceptance                                       |
| ------- | ------------------------------------------------------- | ------- | ------------------------------------------------ |
| T-1.Q01 | Vitest config + unit harness                            | T-1.O01 | `pnpm test:unit` runs; sample test passes        |
| T-1.Q02 | Integration harness (`mongodb-memory-server` or docker) | T-1.D01 | `pnpm test:integration` spins up, drops per test |
| T-1.Q03 | Playwright config + fixtures (users)                    | T-1.O01 | Chromium + WebKit projects green on smoke        |
| T-1.Q04 | Auth e2e happy path (signup → verify → login)           | T-1.F05 | Passes in CI                                     |
| T-1.Q05 | Axe a11y runner wired in e2e                            | T-1.Q03 | Serious/critical = fail                          |

---

## Phase 2 — Catalog (weeks 4–6)

### Database

| ID      | Task                                                                 | Deps    | Acceptance                                |
| ------- | -------------------------------------------------------------------- | ------- | ----------------------------------------- |
| T-2.D01 | Atlas Search index on Product (name/brand/description weighted)      | T-1.D04 | Index exists; sample query relevance sane |
| T-2.D02 | Query helpers for listing (filter/sort/paginate) with index coverage | T-1.D04 | Explain plan: no COLLSCAN on hot queries  |
| T-2.D03 | Seed expanded: 50 products across 8 categories with variants         | T-1.D05 | `pnpm db:seed` yields real-looking data   |

### Backend

| ID      | Task                                              | Deps    | Acceptance                                       |
| ------- | ------------------------------------------------- | ------- | ------------------------------------------------ |
| T-2.B01 | `GET /api/products` list with filters             | T-2.D02 | Pagination envelope; filters match contract      |
| T-2.B02 | `GET /api/products/[slug]` detail                 | T-1.D04 | Includes variants, ratings, related slugs        |
| T-2.B03 | `GET /api/products/[slug]/related`                | T-2.B02 | Max 8; excludes self                             |
| T-2.B04 | `GET /api/categories` tree + `[slug]`             | T-1.D03 | Sub-tree fetch O(1) queries                      |
| T-2.B05 | Admin product CRUD                                | T-1.D04 | Role-gated; activity log written                 |
| T-2.B06 | Cloudinary sign endpoint `POST /api/uploads/sign` | T-1.O11 | Rejects unknown folders; MIME allowlist enforced |
| T-2.B07 | Search autocomplete `GET /api/search/suggest`     | T-2.D01 | ≤50ms p95; typo tolerance verified               |

### Frontend

| ID      | Task                                                                        | Deps             | Acceptance                                         |
| ------- | --------------------------------------------------------------------------- | ---------------- | -------------------------------------------------- |
| T-2.F01 | Homepage skeleton (hero, featured grid, banners)                            | T-1.F04          | Lighthouse perf ≥90 empty state                    |
| T-2.F02 | ProductCard component (image, name, price, swatches, heart)                 | T-1.F03          | 4:5 aspect; hover lift; keyboard focus             |
| T-2.F03 | Listing page `/products` with filters, sort, pagination                     | T-2.B01, T-2.F02 | URL is shareable; no client-side fetch waterfall   |
| T-2.F04 | PDP `/products/[slug]` with gallery + variant selector + ingredients/badges | T-2.B02          | Shade change updates URL `?v=` without full reload |
| T-2.F05 | Category page `/category/[slug]`                                            | T-2.B04          | Shares listing component                           |
| T-2.F06 | Search header input + autocomplete dropdown                                 | T-2.B07          | Debounced 150ms; keyboard navigable                |
| T-2.F07 | Admin product form (create/edit) with Cloudinary uploader                   | T-2.B05, T-2.B06 | Variants editable; unsaved-changes guard           |
| T-2.F08 | Breadcrumbs + structured data (Product, Breadcrumb)                         | T-2.F04          | Validates in Google Rich Results                   |

### QA

| ID      | Task                                          | Deps    | Acceptance                          |
| ------- | --------------------------------------------- | ------- | ----------------------------------- |
| T-2.Q01 | E2E: browse → filter → PDP → select variant   | T-2.F04 | Runs in CI smoke                    |
| T-2.Q02 | Integration: product list filter combinations | T-2.B01 | 12 filter combos asserted           |
| T-2.Q03 | Integration: search relevance snapshot        | T-2.B07 | Known queries return expected top-5 |

---

## Phase 3 — Commerce core (weeks 7–10)

### Database

| ID      | Task                                                    | Deps    | Acceptance                                   |
| ------- | ------------------------------------------------------- | ------- | -------------------------------------------- |
| T-3.D01 | `Cart` model (unique userId) + item subdoc              | T-1.D04 | One cart per user enforced                   |
| T-3.D02 | `Wishlist` model                                        | T-1.D04 | One per user                                 |
| T-3.D03 | `Address` model + default-sibling hook                  | T-1.D02 | Setting default clears others                |
| T-3.D04 | `Order` model with snapshots + status history + indexes | T-1.D04 | orderNumber unique; placedAt index hot       |
| T-3.D05 | `Coupon` model                                          | T-1.D04 | Upper-case code unique                       |
| T-3.D06 | Inventory decrement transaction helper                  | T-3.D04 | Atomic on Atlas replica set; covered by test |

### Backend

| ID      | Task                                                           | Deps             | Acceptance                                         |
| ------- | -------------------------------------------------------------- | ---------------- | -------------------------------------------------- |
| T-3.B01 | Cart Server Actions (add/update/remove/clear)                  | T-3.D01          | priceSnapshot at add-time; optimistic revalidation |
| T-3.B02 | Wishlist toggle                                                | T-3.D02          | Idempotent                                         |
| T-3.B03 | Addresses CRUD + set default                                   | T-3.D03          | Default invariant verified                         |
| T-3.B04 | Coupon engine: validate + apply                                | T-3.D05, T-3.D01 | Stacking rejected; per-user limit enforced         |
| T-3.B05 | `placeOrderAction` (transactional: stock + order + cart clear) | T-3.D04, T-3.D06 | Idempotency key honored; rollback on failure       |
| T-3.B06 | Guest checkout order path                                      | T-3.B05          | Creates order without userId; email required       |
| T-3.B07 | Order history + detail endpoints                               | T-3.D04          | Owner-scoped; admin can read any                   |
| T-3.B08 | Order cancel within 2h + reorder                               | T-3.B05          | State transition rules enforced                    |
| T-3.B09 | Invoice PDF download                                           | T-3.D04          | Server-rendered; BDT formatting                    |
| T-3.B10 | Free-shipping threshold calc                                   | T-3.B01          | Returned in cart payload                           |

### Frontend

| ID      | Task                                                      | Deps             | Acceptance                                 |
| ------- | --------------------------------------------------------- | ---------------- | ------------------------------------------ |
| T-3.F01 | Cart drawer + cart page                                   | T-3.B01          | Mobile sheet; keyboard accessible          |
| T-3.F02 | Wishlist page + heart toggle on ProductCard               | T-3.B02          | Optimistic UI; reverts on error            |
| T-3.F03 | Address book UI (list/add/edit/default)                   | T-3.B03          | Inline edit; confirmation on delete        |
| T-3.F04 | Checkout flow (address → review → place)                  | T-3.B05, T-3.F03 | 3-step with progress; back preserves state |
| T-3.F05 | Guest checkout path with "create account at confirmation" | T-3.B06          | Account creation wires order.userId        |
| T-3.F06 | Order confirmation page + status timeline                 | T-3.B07          | Shareable link for guests                  |
| T-3.F07 | Order history + detail + reorder button                   | T-3.B07, T-3.B08 | Reorder refills cart and navigates         |
| T-3.F08 | Coupon input + free-shipping progress bar                 | T-3.B04, T-3.B10 | Error messages clear                       |

### QA

| ID      | Task                                                            | Deps    | Acceptance                      |
| ------- | --------------------------------------------------------------- | ------- | ------------------------------- |
| T-3.Q01 | E2E: add to cart → checkout → COD → confirmation                | T-3.F04 | Both logged-in and guest paths  |
| T-3.Q02 | E2E: apply/remove coupon (valid, expired, invalid)              | T-3.F08 | Correct messages                |
| T-3.Q03 | Integration: order placement transaction rollback on stock fail | T-3.B05 | Stock restored; no orphan order |
| T-3.Q04 | E2E: reorder past order                                         | T-3.F07 | Cart populated                  |

---

## Phase 4 — User features (weeks 11–13)

### Database

| ID      | Task                                                 | Deps    | Acceptance                    |
| ------- | ---------------------------------------------------- | ------- | ----------------------------- |
| T-4.D01 | `Review` model + uniqueness `(user, product, order)` | T-3.D04 | Verified-buyer check possible |

### Backend

| ID      | Task                                                                     | Deps             | Acceptance                                          |
| ------- | ------------------------------------------------------------------------ | ---------------- | --------------------------------------------------- |
| T-4.B01 | Profile GET/PATCH + avatar upload                                        | T-1.D02, T-2.B06 | Zod validates phone/DOB                             |
| T-4.B02 | Reviews submit / list / helpful / admin moderate                         | T-4.D01          | HTML sanitized; verified badge on match             |
| T-4.B03 | Email templates & senders: order placed/shipped/delivered, reset, verify | T-1.B03          | React Email render + Resend send mocked in tests    |
| T-4.B04 | Notification preferences (opt-in flags on User)                          | T-1.D02          | Respected in email sender                           |
| T-4.B05 | GDPR export + delete                                                     | T-1.D02          | Anonymizes orders, cascades carts/wishlists/reviews |

### Frontend

| ID      | Task                                                      | Deps    | Acceptance                                  |
| ------- | --------------------------------------------------------- | ------- | ------------------------------------------- |
| T-4.F01 | Profile edit page (name, phone, DOB, skin type, avatar)   | T-4.B01 | Skin-type selector matches review filter    |
| T-4.F02 | Review submit form on PDP (post-delivery)                 | T-4.B02 | Image upload; char limits; rating           |
| T-4.F03 | Review list with filters (star, skin type) + helpful vote | T-4.B02 | Verified badge rendered                     |
| T-4.F04 | Email templates in `src/emails/*.tsx`                     | T-4.B03 | Previewed locally via `react-email preview` |
| T-4.F05 | Account > delete/export flows                             | T-4.B05 | 2-step confirm on delete                    |

### QA

| ID      | Task                                                              | Deps    | Acceptance              |
| ------- | ----------------------------------------------------------------- | ------- | ----------------------- |
| T-4.Q01 | E2E: submit review post-delivery → admin approve → appears on PDP | T-4.F03 | Covers verified badge   |
| T-4.Q02 | Integration: review uniqueness constraint                         | T-4.D01 | Duplicate rejected      |
| T-4.Q03 | Integration: email templates render without runtime error         | T-4.F04 | All variables populated |

---

## Phase 5 — Admin & ops (weeks 14–16)

### Backend

| ID      | Task                                                          | Deps    | Acceptance                   |
| ------- | ------------------------------------------------------------- | ------- | ---------------------------- |
| T-5.B01 | Admin dashboard stats endpoint (revenue/orders/top/low stock) | T-3.D04 | Cached 60s                   |
| T-5.B02 | Order status update with timeline + tracking                  | T-3.D04 | State machine enforced       |
| T-5.B03 | Inventory adjust + low-stock list                             | T-3.D04 | Activity log written         |
| T-5.B04 | Coupon CRUD                                                   | T-3.D05 | Overlap / validity validated |
| T-5.B05 | Banner CRUD + homepage query                                  | T-1.D04 | Draft vs published           |
| T-5.B06 | Customer list + detail                                        | T-1.D02 | Read-only for support role   |
| T-5.B07 | Review moderation queue                                       | T-4.D01 | Bulk approve                 |
| T-5.B08 | Sales report (JSON + CSV)                                     | T-3.D04 | Date range, group by day     |
| T-5.B09 | Activity log feed                                             | T-1.D02 | Filter by actor/entity       |

### Frontend

| ID      | Task                                     | Deps    | Acceptance                              |
| ------- | ---------------------------------------- | ------- | --------------------------------------- |
| T-5.F01 | Admin dashboard widgets                  | T-5.B01 | Loads <1s with cache                    |
| T-5.F02 | Orders list + detail + status update UI  | T-5.B02 | Tracking number editable; note captured |
| T-5.F03 | Inventory page with low-stock highlights | T-5.B03 | Sort by stock asc                       |
| T-5.F04 | Coupon creator form                      | T-5.B04 | Preview final prices                    |
| T-5.F05 | Banner CMS (upload, schedule, reorder)   | T-5.B05 | Drag-reorder persists                   |
| T-5.F06 | Customers list + profile                 | T-5.B06 | Full order history inline               |
| T-5.F07 | Review moderation UI                     | T-5.B07 | Bulk actions                            |
| T-5.F08 | Reports UI with CSV export               | T-5.B08 | Date picker; chart + table              |
| T-5.F09 | Activity log page                        | T-5.B09 | Paginated                               |
| T-5.F10 | Role management UI                       | T-5.B06 | Assign/revoke roles with confirm        |

### QA

| ID      | Task                                                     | Deps    | Acceptance                            |
| ------- | -------------------------------------------------------- | ------- | ------------------------------------- |
| T-5.Q01 | E2E: admin updates order status → customer sees timeline | T-5.F02 | Both sides verified                   |
| T-5.Q02 | E2E: non-admin blocked from admin routes                 | T-5.F01 | 403/redirect                          |
| T-5.Q03 | Integration: sales report math                           | T-5.B08 | Deterministic numbers from fixed seed |

---

## Phase 6 — Growth (weeks 17–19, post-MVP optional)

| ID      | Lane     | Task                                         | Deps    | Acceptance                                   |
| ------- | -------- | -------------------------------------------- | ------- | -------------------------------------------- |
| T-6.B01 | backend  | Abandoned-cart cron + email                  | T-4.B03 | Fires once per cart/24h; unsubscribe honored |
| T-6.B02 | backend  | Back-in-stock request + batch notifier cron  | T-1.D04 | De-dupes per (user,variant)                  |
| T-6.B03 | backend  | Loyalty points accrual + redeem              | T-3.D04 | Floor-to-paisa math verified                 |
| T-6.B04 | backend  | Referral code attribution                    | T-1.D02 | First-order detection correct                |
| T-6.B05 | backend  | Blog post model + CRUD                       | —       | Markdown body sanitized                      |
| T-6.F01 | frontend | Bangla locale copy pass + `next-intl` wiring | —       | PDP + checkout + account localized           |
| T-6.F02 | frontend | Blog pages                                   | T-6.B05 | SEO metadata per post                        |
| T-6.F03 | frontend | "Recently viewed" + "customers also bought"  | T-2.B02 | Client-only storage allowed                  |
| T-6.O01 | devops   | Sitemap + robots.txt + OG image generator    | —       | Valid XML; per-product OG                    |
| T-6.O02 | devops   | Cron endpoints guarded by CRON_SECRET        | T-6.B01 | 401 without header                           |
| T-6.Q01 | qa       | E2E: subscribe newsletter + unsubscribe      | —       | Email link works                             |

---

## Phase 7 — Hardening & launch (weeks 20–22)

| ID      | Lane     | Task                                                | Deps | Acceptance                               |
| ------- | -------- | --------------------------------------------------- | ---- | ---------------------------------------- |
| T-7.F01 | frontend | Lighthouse polish (LCP <2.5s, CLS <0.1, INP <200ms) | —    | Budgets green on staging                 |
| T-7.F02 | frontend | A11y audit pass — keyboard, SR labels, contrast     | —    | Axe serious/critical = 0                 |
| T-7.F03 | frontend | Dark mode flag (optional; default off)              | —    | No regression if disabled                |
| T-7.S01 | security | CSP move from report-only to enforced (nonces)      | —    | No violations on prod routes             |
| T-7.S02 | security | Penetration test findings resolved                  | —    | No high findings open                    |
| T-7.S03 | security | Rate-limit verification (real Redis)                | —    | Limits enforced on preview prod-like env |
| T-7.O01 | devops   | Atlas backup restore drill                          | —    | Runbook captured                         |
| T-7.O02 | devops   | Load test checkout path (k6)                        | —    | 100 RPS sustained 5 min                  |
| T-7.O03 | devops   | Launch runbook + on-call rotation                   | —    | Published in `docs/runbook.md`           |
| T-7.O04 | devops   | SPF + DKIM + DMARC for Resend                       | —    | mail-tester.com ≥ 9/10                   |
| T-7.Q01 | qa       | Expand Playwright to full 12 required flows         | —    | All green on both browsers               |
| T-7.Q02 | qa       | Accessibility spot-checks on admin panel            | —    | Axe serious/critical = 0                 |
| T-7.Q03 | qa       | Regression test catalog compiled                    | —    | Runbook references it                    |
| T-7.B01 | backend  | Privacy policy + T&Cs pages + consent banner        | —    | Recorded in `User.consents`              |

---

## Post-MVP backlog (not scheduled)

- Subscribe & save / auto-reorder
- Tiered membership + birthday discount
- Find Your Shade quiz
- Q&A per product
- Video reviews
- Save-for-later separate from wishlist
- SMS notifications
- Price-drop alerts
- Bulk product CSV import
- Meilisearch migration
- Multi-warehouse inventory
- Returns / exchange self-service flow
- Mobile app (React Native)

---

## How to work this list

1. Orchestrator picks the next phase's top-of-queue tasks.
2. For each task: open a GitHub issue from the task template, paste the row, label with the lane.
3. Assign to the corresponding agent.
4. Agent branches `<type>/<agent>-<scope>-<short>-#<issue>`, works, opens PR.
5. Merge updates this file's check state (or drop the row once merged + backed into this doc isn't required — the issue is the durable record).

## Phase-gate checks

Before moving to the next phase, orchestrator verifies:

- All tasks in prior phase merged or explicitly deferred.
- CI green on `develop` for 24h.
- No open blocker issues.
- Docs updated for any contract drift.
- Memory pointer updated for load-bearing decisions.

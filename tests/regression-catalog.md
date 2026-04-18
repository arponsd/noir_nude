# Regression test catalog

Maps every required MVP flow (see `docs/15-testing.md`) to the Playwright spec
file, test name(s), and the tag(s) under which it runs. Update the "Last
verified" column when a flow has been manually re-run green against a preview
or staging deploy.

## 12 required MVP flows

| #   | Flow                                                      | Spec file                                                    | Test name(s)                                                                                                              | Tag(s)               | Last verified |
| --- | --------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------- |
| 1   | Signup → email verify → login                             | `tests/e2e/full-flows.spec.ts`, `tests/e2e/auth.spec.ts`     | "register surfaces the check-your-email confirmation", "verified user can log in and lands on /account"                   | `@full`, `@auth`     | YYYY-MM-DD    |
| 2   | Browse → filter → PDP → variant                           | `tests/e2e/full-flows.spec.ts`, `tests/e2e/catalog.spec.ts`  | "filter by category, open PDP, select variant", "PDP variant selection updates the displayed price"                       | `@full`, `@catalog`  | YYYY-MM-DD    |
| 3   | Logged-in add to cart → COD checkout → confirmation       | `tests/e2e/full-flows.spec.ts`, `tests/e2e/commerce.spec.ts` | "add to cart → checkout → place COD order → confirmation", "flow 1: browse → PDP → add to cart → checkout → confirmation" | `@full`, `@commerce` | YYYY-MM-DD    |
| 4   | Guest checkout → confirmation → optional account creation | `tests/e2e/full-flows.spec.ts`                               | "guest places order and can opt into account creation"                                                                    | `@full`              | YYYY-MM-DD    |
| 5   | Reorder a past order                                      | `tests/e2e/full-flows.spec.ts`, `tests/e2e/commerce.spec.ts` | "reorder button repopulates cart from a prior order", "flow 4: reorder a past order populates cart"                       | `@full`, `@commerce` | YYYY-MM-DD    |
| 6   | Admin ships order → customer timeline updates             | `tests/e2e/full-flows.spec.ts`                               | "admin marks order shipped and customer timeline updates"                                                                 | `@full`              | YYYY-MM-DD    |
| 7   | Wishlist toggle persistence                               | `tests/e2e/full-flows.spec.ts`, `tests/e2e/commerce.spec.ts` | "toggled wishlist item persists across reload", "flow 5: wishlist toggle persists across reload"                          | `@full`, `@commerce` | YYYY-MM-DD    |
| 8   | Coupon apply / invalid / expired                          | `tests/e2e/full-flows.spec.ts`, `tests/e2e/commerce.spec.ts` | "valid, invalid, and expired coupons surface distinct responses", "flow 2: apply valid coupon then invalid coupon"        | `@full`, `@commerce` | YYYY-MM-DD    |
| 9   | Address CRUD + set default                                | `tests/e2e/full-flows.spec.ts`, `tests/e2e/commerce.spec.ts` | "add, set default, delete an address", "flow 6: address book CRUD + set default"                                          | `@full`, `@commerce` | YYYY-MM-DD    |
| 10  | Submit review → admin approves → review appears on PDP    | `tests/e2e/full-flows.spec.ts`, `tests/e2e/reviews.spec.ts`  | "customer submits review; admin approves; review renders on PDP"                                                          | `@full`, `@reviews`  | YYYY-MM-DD    |
| 11  | 401/403 on admin route as customer                        | `tests/e2e/full-flows.spec.ts`, `tests/e2e/admin.spec.ts`    | "logged-in customer visiting /admin/dashboard is denied", "admin can access /admin/dashboard; customer gets /403"         | `@full`, `@admin`    | YYYY-MM-DD    |
| 12  | Rate limit: 6 failed logins → 429                         | `tests/e2e/full-flows.spec.ts`                               | "sixth failed login attempt returns 429"                                                                                  | `@full`              | YYYY-MM-DD    |

## Tag catalog

These tags select subsets of the e2e suite for specific phases of the pipeline.
Run a tag with `pnpm test:e2e --grep @<tag>`.

| Tag           | Covers                                                                       | Where                          |
| ------------- | ---------------------------------------------------------------------------- | ------------------------------ |
| `@smoke`      | Homepage renders + axe pass. PR gate; must finish under 5 minutes.           | `tests/e2e/smoke.spec.ts`      |
| `@auth`       | Credentials login/register/sign-out/guard redirect + wrong-password path.    | `tests/e2e/auth.spec.ts`       |
| `@commerce`   | Cart, checkout, order cancel, reorder, wishlist, address CRUD, axe checks.   | `tests/e2e/commerce.spec.ts`   |
| `@catalog`    | Product listing, filter, search, autocomplete, PDP, variant behaviour, axe.  | `tests/e2e/catalog.spec.ts`    |
| `@admin`      | Admin guard + admin-side flows (order status, inventory).                    | `tests/e2e/admin.spec.ts`      |
| `@reviews`    | PDP review surface; unauth guard on submit.                                  | `tests/e2e/reviews.spec.ts`    |
| `@full`       | All 12 required MVP flows end-to-end, including multi-context flows (6, 10). | `tests/e2e/full-flows.spec.ts` |
| `@admin-a11y` | Serious/critical axe pass on every admin page.                               | `tests/e2e/admin-a11y.spec.ts` |

## How to run

```bash
# Full e2e suite (post-merge, nightly).
pnpm test:e2e

# PR gate — smoke only.
pnpm test:e2e:smoke

# Pre-release gate — walk all 12 MVP flows.
pnpm test:e2e --grep @full

# Single tag (e.g. just the admin a11y sweep).
pnpm test:e2e --grep @admin-a11y
```

### Global setup expectations

`tests/e2e/global-setup.ts` seeds three fixture users and one delivered order
before the suite runs. It reads `MONGODB_URI` and `MONGODB_DB` and must point
at the same database the Next.js server is reading. See the file header for
the full env-var list.

`tests/e2e/global-teardown.ts` drops the test database at the end of the run —
guarded to only touch database names containing `test` or `e2e`.

## Flow 12 prerequisite

Rate-limit flow requires a persistent in-process limiter (the in-memory
fallback in `src/lib/security/rate-limit.ts`) or a real Upstash connection.
When running against a multi-worker/serverless target the limiter state is not
shared — run flow 12 against a single Node process or wire Upstash for the run.

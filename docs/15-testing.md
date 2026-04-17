# 15 — Testing

Owner: `qa` agent. Every other agent writes tests for their own code; qa owns the harness, fixtures, and e2e suite.

## Pyramid

```
         ┌────────────┐
         │    E2E     │  Playwright, ~30 specs (happy + critical fail paths)
         ├────────────┤
         │ Integration│  Vitest + real MongoDB (testcontainers), ~150 specs
         ├────────────┤
         │   Unit     │  Vitest, ~500 specs (utils, validators, services)
         └────────────┘
```

## Unit tests

- Vitest, ESM, swc transform.
- Path: `tests/unit/<mirror-of-src>/...`.
- No DB. Mock at the service boundary.
- Targets: validators, money math, formatters, state machines, coupon engine.
- Coverage gate: 80% lines on `src/lib/**`.

## Integration tests

- Vitest with `globalSetup` that spins up MongoDB via `mongodb-memory-server`.
- Real Mongoose models.
- Path: `tests/integration/<domain>/...`.
- Targets: route handlers, server actions, transactions.
- Each test gets a fresh DB (`beforeEach: dropDatabase`).

## E2E tests

- Playwright, Chromium + WebKit.
- Path: `tests/e2e/<flow>.spec.ts`.
- Run against preview deploys in CI; against `pnpm dev` locally.
- Seeded test users live in `tests/fixtures/users.ts`.

### Required E2E flows (MVP)

1. New user signup → email verify → login.
2. Browse categories → filter → open PDP → select variant.
3. Add to cart (logged-in) → drawer → checkout → COD → confirmation.
4. Guest checkout → confirmation page → optional account creation.
5. Reorder a past order.
6. Place order → admin marks shipped → user sees timeline update.
7. Wishlist toggle, persistence across sessions.
8. Apply coupon, invalid coupon, expired coupon.
9. Address book CRUD + set default.
10. Submit review → admin approves → review appears on PDP.
11. 401/403 on admin route as customer.
12. Rate limit: 6 failed logins returns 429.

## Fixtures

- `tests/fixtures/db.ts` — seed helpers callable from any test.
- `tests/fixtures/users.ts` — admin, customer, second-customer, support.
- `tests/fixtures/products.ts` — catalog with variants for filter tests.
- Cloudinary URLs fixed strings (no real upload in tests).

## Mocking

- Email (Resend): mocked in unit/integration; use Resend test mode in e2e.
- Cloudinary signing: stubbed in tests.
- Upstash: in-memory shim under `tests/harness/redis.ts`.
- Time: `vi.useFakeTimers()` for date-sensitive logic.

## Accessibility tests

- `@axe-core/playwright` runs on every e2e page.
- Fails on serious or critical violations.

## Performance tests

- Manual Lighthouse CI on staging weekly.
- Bundle-size budget enforced via CI on every PR.

## Test data hygiene

- No production data in tests, ever.
- Test emails go to `+test@<domain>` aliases or Resend sandbox.
- Test orders flagged with `isTest: true` and excluded from admin dashboards.

## Running

```bash
pnpm test                # all
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:e2e:smoke      # subset for CI on PR
pnpm test:watch
pnpm coverage
```

## Definition of done (testing)

- Every new endpoint: integration test for happy path + at least one auth/validation failure.
- Every new component with logic: unit test or RTL test.
- Every new flow: e2e covering happy path.
- No skipped tests merged without an issue link in the skip annotation.

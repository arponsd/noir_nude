# 02 — Multi-Agent Model

Six specialist agents work the repo in parallel. Each has a file-path partition and a task lane. The orchestrator (main Claude Code session) picks tasks, routes to the right agent, and resolves cross-cutting conflicts.

## Agents

### `frontend`

Pages, layouts, client components, client state, data-fetching hooks, styling, accessibility.
Owns: `src/app/(shop)/**`, `src/app/(auth)/**`, `src/components/shop/**`, `src/components/shared/**`, `src/components/ui/**`, `src/hooks/**`, `src/emails/**`.

### `backend`

Route handlers, Server Actions, business logic, Zod schemas (non-auth), email sending, Cloudinary signing, coupon engine, order state machine.
Owns: `src/app/api/**`, `src/lib/actions/**`, `src/lib/validators/**` (except auth), `src/lib/services/**`.

### `database`

Mongoose schemas, indexes, migrations (in-repo scripts), seed data, query helpers, aggregation pipelines.
Owns: `src/lib/db/**`, `scripts/seed/**`, `scripts/migrate/**`.

### `security`

NextAuth config, middleware, CSRF, rate limiting, password hashing, breach check, role guards, auth-related Zod, activity log.
Owns: `src/lib/auth/**`, `src/middleware.ts`, `src/lib/validators/auth.ts`, `src/lib/rate-limit/**`, `src/lib/csrf/**`.

### `devops`

CI, deployment, env vars, monitoring wiring, perf budget, bundle analyzer, Cloudinary + Upstash + Atlas project setup docs.
Owns: `.github/**`, `next.config.ts`, `.env.example`, `vercel.json`, `instrumentation.ts`, `docs/14-devops.md`.

### `qa`

Unit tests (Vitest), integration tests, Playwright e2e, fixtures, test database setup, CI test matrix, accessibility audits.
Owns: `tests/**`, `playwright.config.ts`, `vitest.config.ts`, `tests/fixtures/**`.

## Shared files (require owner + reviewer)

| File                   | Primary owner | Must ping               |
| ---------------------- | ------------- | ----------------------- |
| `package.json`         | devops        | all                     |
| `tsconfig.json`        | devops        | frontend, backend       |
| `tailwind.config.ts`   | frontend      | —                       |
| `src/app/layout.tsx`   | frontend      | security (providers)    |
| `src/types/**`         | backend       | frontend, database      |
| `src/lib/constants.ts` | backend       | all                     |
| `docs/04-contracts.md` | orchestrator  | all (requires sign-off) |

## Task routing

Tasks declared in this format before an agent picks them up:

```
TASK-###
Owner: <agent>
Files: <paths>
Depends on: <TASK-###, ...>
Acceptance: <bullet list>
```

## Conflict resolution

If two agents need to edit the same file:

1. Orchestrator splits the task along a line or helper boundary.
2. If inseparable → one agent edits, the other reviews.
3. Never merge two concurrent edits to the same region.

## Handoff protocol

When an agent finishes, it reports: files touched, exported symbols added/changed/removed, tests added, and any follow-up task for another agent (e.g., frontend needs a new API shape → backend task).

# 07 — Coding Standards

## TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`.
- No `any`. If unavoidable, use `unknown` and narrow, or write `// reason: <why>` comment.
- No `as` casts except at well-defined boundaries (Mongoose lean docs → DTO mapping).
- Prefer `type` for object shapes, `interface` only when extending.
- Discriminated unions for state: `{ status: "loading" } | { status: "ready", data } | { status: "error", error }`.

## Naming

- Files: `kebab-case.ts(x)`. Component files match the default export: `ProductCard.tsx`.
- Components: `PascalCase`.
- Functions, vars: `camelCase`.
- Constants: `SCREAMING_SNAKE_CASE`.
- Mongoose models: `PascalCase` singular: `User`, `Product`.
- Server actions: verb-first: `addToCartAction`, `placeOrderAction`.
- Zod schemas: suffix `Schema`: `loginSchema`.

## React / Next.js

- App Router only. No `pages/`.
- Default to **Server Components**. Mark `"use client"` only when you need state, effects, or browser APIs.
- One default export per file (the component). Helpers stay un-exported or named-exported below.
- Co-locate `loading.tsx`, `error.tsx`, `not-found.tsx` per route segment when meaningful.
- No data fetching in client components — pass props down from the server, or use TanStack Query for mutations.
- Use `next/image` always. Width/height required.
- Use `next/link` always. Never `<a>` for internal nav.
- Forms: React Hook Form + Zod resolver, Server Action as `action` prop or `formAction`.

## Imports

- Path alias `@/` → `src/`.
- Order: builtin → external → `@/` → relative. Enforced by ESLint.
- No circular imports. Refactor into `src/lib/utils/` or `src/types/` if needed.

## Styling

- Tailwind utilities first. Component-level CSS modules only when truly needed (one-off animations).
- shadcn/ui as base; restyle in `components/ui/<name>.tsx` rather than overriding inline everywhere.
- No inline `style={{}}` except for dynamic values (e.g., progress bar width).
- Design tokens in `tailwind.config.ts` — no magic colors in components.

## Validation

- Zod at every boundary: API handlers, Server Actions, form submits, env parsing.
- Shared schemas in `src/lib/validators/<domain>.ts`. Frontend and backend import the same schema.
- `safeParse` then return a typed error response. Never throw raw ZodError to the client.

## Error handling

- Use `safeAction()` wrapper for Server Actions and `safeRoute()` for route handlers — both report to Sentry and return the standard `ApiResponse`.
- Never `console.error` in production code. Use `logger.error` from `src/lib/utils/logger.ts`.
- User-facing error messages live in the i18n catalog, not hardcoded.

## Database access

- Only files under `src/lib/db/**` import Mongoose models.
- Services in `src/lib/services/**` orchestrate DB calls.
- Components and routes call services, not models directly.
- Always `.lean()` on read queries unless you need methods/virtuals.
- Project only the fields you need.

## Comments

- Default to none. Identifiers should explain themselves.
- Write a comment only when the _why_ is non-obvious: a workaround, an invariant, a constraint that wouldn't be guessed from the code.
- No "what" comments. No history-style comments ("added for ticket X").
- One-line max in most cases. No multi-paragraph docstrings.

## Tests

- Co-locate? **No.** All tests under `tests/`. Mirror the `src/` tree.
- One behavior per test. Name format: `it("does X when Y")`.
- No snapshot tests for non-trivial components — they rot.
- E2E: only happy paths + critical error paths. Don't try to e2e every edge case.

## Git

- Branch: `feat/<scope>-<short>`, `fix/<scope>-<short>`, `chore/<scope>-<short>`.
- Commit: imperative, ≤72 char subject, body when not obvious.
- One logical change per PR. ≤500 LOC diff target.
- Squash on merge.

## Dependencies

- New dep needs a one-line justification in the PR description.
- Prefer std lib + already-installed deps over adding new ones.
- No deps with <1k weekly downloads or no recent commits.

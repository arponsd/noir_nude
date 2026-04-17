# Cosmetic E-Commerce — Project Entry Point

**Stack:** Next.js 15 (App Router) · TypeScript (strict) · MongoDB + Mongoose · NextAuth.js v5 · Tailwind + shadcn/ui · COD payment · BDT (৳) currency · Bangla/English i18n-ready

**Status:** Planning phase. No scaffold yet. First code action should be `npx create-next-app` after contracts are confirmed.

---

## Read before coding

1. `documents/cosmetic-ecommerce-plan.md` — source-of-truth product plan
2. `docs/04-contracts.md` — **locked decisions** (do not deviate without updating)
3. `docs/03-file-ownership.md` — which agent owns which paths
4. `docs/07-coding-standards.md` — conventions every agent follows
5. `docs/06-api-contract.md` — API shape contracts between frontend and backend
6. `docs/16-git-workflow.md` — branches, commits, PRs, hooks, releases
7. `docs/17-tasks.md` — durable task backlog per phase per lane

---

## Multi-agent model

Six parallel agents. Each owns a partition of the file tree. See `docs/02-agents.md` and `.claude/agents/*.md`.

| Agent                                           | Domain                                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| frontend                                        | `src/app/(shop)/**`, `src/app/(auth)/**`, `src/components/shop/**`, `src/components/shared/**`, `src/hooks/**` |
| backend                                         | `src/app/api/**`, `src/lib/actions/**`, `src/lib/validators/**`                                                |
| database                                        | `src/lib/db/**`, seed scripts, indexes                                                                         |
| security                                        | `src/lib/auth/**`, `src/middleware.ts`, rate limit, CSRF, Zod schemas for auth                                 |
| devops                                          | `.github/**`, `next.config.ts`, env, deployment, monitoring                                                    |
| qa                                              | `tests/**`, Playwright, Vitest, CI test matrix                                                                 |
| admin (shared sub-role inside frontend+backend) | `src/app/admin/**`, `src/components/admin/**`                                                                  |

Agents MUST NOT edit files outside their partition without handing the task to the owning agent.

---

## Hard rules

- TypeScript **strict** always. No `any` without a `// reason:` note.
- Zod validation at every API / Server Action boundary. No exceptions.
- Cart is **DB-backed and user-scoped**. No localStorage cart.
- Guest checkout is supported — account created optionally at order confirmation.
- Payment method is **COD only** for launch. Do not stub Stripe or any online gateway.
- `httpOnly`, `secure`, `sameSite=lax` session cookies.
- CSRF tokens required on every non-GET route that mutates state.
- Rate limiting on `/api/auth/*`, `/api/orders`, `/api/reviews`.
- Image uploads through Cloudinary signed uploads only.
- All prices stored in minor units (paisa / 1 BDT = 100 paisa). Never use floats for money.
- Snapshot product name, image, sku, price into Order items at order time.

---

## Phase gate

Currently at **Phase 0 — Docs**. Next action: confirm MVP scope (`docs/10-mvp-scope.md`) then scaffold Next.js.

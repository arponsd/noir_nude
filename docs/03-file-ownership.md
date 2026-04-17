# 03 — File Ownership

Strict path partition. An agent MUST NOT write outside its lane; it requests the owning agent to make the change.

## Tree

```
cosmetic-ecommerce/
├── src/
│   ├── app/
│   │   ├── (shop)/**                 → frontend
│   │   ├── (auth)/**                 → frontend (forms) + security (actions wired)
│   │   ├── admin/**                  → frontend + backend (shared sub-lane)
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   → security
│   │   │   ├── admin/**              → backend
│   │   │   └── **                    → backend
│   │   ├── layout.tsx                → frontend (security review)
│   │   ├── globals.css               → frontend
│   │   └── not-found.tsx, error.tsx  → frontend
│   ├── components/
│   │   ├── ui/**                     → frontend (shadcn primitives)
│   │   ├── shop/**                   → frontend
│   │   ├── admin/**                  → frontend
│   │   └── shared/**                 → frontend
│   ├── lib/
│   │   ├── db/**                     → database
│   │   ├── auth/**                   → security
│   │   ├── rate-limit/**             → security
│   │   ├── csrf/**                   → security
│   │   ├── validators/
│   │   │   ├── auth.ts               → security
│   │   │   └── **                    → backend
│   │   ├── actions/**                → backend
│   │   ├── services/**               → backend
│   │   ├── utils/**                  → shared (whoever needs it, small PRs)
│   │   ├── analytics/**              → frontend
│   │   └── constants.ts              → backend (changes need all-agent ping)
│   ├── hooks/**                      → frontend
│   ├── emails/**                     → frontend (templates) + backend (senders)
│   ├── types/**                      → backend (shared contracts)
│   └── middleware.ts                 → security
├── tests/
│   ├── unit/**                       → qa
│   ├── integration/**                → qa
│   ├── e2e/**                        → qa
│   └── fixtures/**                   → qa + database (seed alignment)
├── scripts/
│   ├── seed/**                       → database
│   └── migrate/**                    → database
├── .github/**                        → devops
├── .claude/**                        → orchestrator
├── docs/**                           → orchestrator (agents PR edits)
├── public/**                         → frontend
├── next.config.ts                    → devops
├── tailwind.config.ts                → frontend
├── tsconfig.json                     → devops
├── package.json                      → devops
├── playwright.config.ts              → qa
├── vitest.config.ts                  → qa
└── instrumentation.ts                → devops
```

## Rules

- New top-level directory requires an update to this file first.
- Renames across lanes require orchestrator approval.
- Generated files (`.next/`, `node_modules/`, `coverage/`) are gitignored and have no owner.
- `src/types/**` is the only place where cross-agent type contracts live. Always import from `@/types/...` instead of copying types.

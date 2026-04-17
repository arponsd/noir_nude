# 01 — Architecture

## Layers

```
┌─────────────────────────────────────────────┐
│  Browser (Next.js client components)        │
│    Zustand (UI) · TanStack Query (server)   │
└───────────┬─────────────────────────────────┘
            │ fetch / Server Action
┌───────────▼─────────────────────────────────┐
│  Next.js App Router (Vercel, edge-friendly) │
│    RSC · Server Actions · Route Handlers    │
│    middleware.ts: auth + rate limit + CSRF  │
└───────────┬─────────────────────────────────┘
            │
       ┌────┴────┬──────────┬──────────┐
       ▼         ▼          ▼          ▼
  MongoDB    Upstash    Cloudinary   Resend
  (Atlas)    Redis      (images)     (email)
                │
            rate limit,
            back-in-stock queue,
            product cache
```

## Request lifecycle (example: add-to-cart)

1. Client calls Server Action `addToCart({ productId, variantId, qty })`.
2. `middleware.ts` → session check + rate limit bucket.
3. Action validates payload via Zod schema in `src/lib/validators/cart.ts`.
4. Action calls `src/lib/db/models/Cart.ts` — upsert on `userId`.
5. Product stock re-checked against variant; price snapshot taken.
6. Revalidate path `/cart` and return cart summary.
7. TanStack Query cache updated; Zustand UI opens drawer.

## Directory layout

Defined in `documents/cosmetic-ecommerce-plan.md` §3. Treated as contract — every agent uses the same tree.

## Caching strategy

| Data                  | Where              | TTL                              |
| --------------------- | ------------------ | -------------------------------- |
| Product list (public) | Next fetch cache   | 60s, revalidateTag on admin edit |
| Product detail        | Next fetch cache   | 120s, tag per-slug               |
| User cart             | DB only (no cache) | —                                |
| Session               | JWT cookie         | 7 days rolling                   |
| Rate limit counters   | Upstash Redis      | 60s sliding                      |
| Search suggestions    | Atlas Search live  | —                                |

## Error + observability

- Sentry initialized in `instrumentation.ts`.
- Every Server Action wraps its body in a shared `safeAction()` helper that reports thrown errors.
- PostHog event names in `src/lib/analytics/events.ts` — no string literals scattered in components.

## Environment promotion

`local → preview (Vercel per-PR) → production`. Preview has its own MongoDB Atlas project and Upstash instance. No shared secrets.

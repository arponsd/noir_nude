# 04 — Locked Contracts

These decisions are **frozen**. Any change requires updating this file first and pinging every agent.

## Auth

- **Library:** NextAuth.js v5
- **Strategy:** JWT session, 7-day rolling expiry
- **Cookie:** `__Secure-next-auth.session-token`, `httpOnly`, `secure`, `sameSite=lax`, `path=/`
- **Providers:** Credentials (email+password), Google, Facebook
- **Password hash:** bcrypt, 12 rounds
- **Email verification:** required before checkout (Resend magic link, 24h expiry)
- **Roles:** `customer | admin | manager | support`
- **Role guard:** middleware redirect, plus `requireRole()` helper at handler entry

## CSRF

- All non-GET routes require an `x-csrf-token` header.
- Token generated server-side, mirrored in `csrf-token` cookie (double-submit pattern).
- Server Actions are exempt (they have built-in origin checks via Next 15).

## Rate limiting (Upstash Redis sliding window)

| Route                                                   | Limit              |
| ------------------------------------------------------- | ------------------ |
| `POST /api/auth/login`, `/register`, `/forgot-password` | 5 / minute / IP    |
| `POST /api/orders`                                      | 10 / hour / user   |
| `POST /api/orders/guest`                                | 10 / hour / IP     |
| `POST /api/reviews`                                     | 3 / hour / user    |
| `POST /api/cart/items` (and all cart mutations)         | 30 / minute / user |
| `POST /api/wishlist/toggle`                             | 30 / minute / user |
| `POST /api/uploads/sign`                                | 30 / minute / user |
| `/api/user/**` mutations                                | 30 / minute / user |
| `/api/addresses/**` mutations                           | 60 / minute / user |
| Search autocomplete                                     | 60 / minute / IP   |

Additive extension (T-7.S02) — `profileLimiter` (30/min/user) and `addressLimiter`
(60/min/user) were added in Phase 7. They do not conflict with any previously
locked row; they tighten routes that previously had no explicit bucket.

## Cart

- DB-backed, **one cart per user** (unique index on `userId`).
- No localStorage cart. No anonymous cart merge.
- Guest checkout creates an Order without a User. Optional account creation at confirmation page links the order via `userId` patch.
- `priceSnapshot` per cart item (price at add-time). Re-priced at checkout against current product price; user warned if changed.

## Guest checkout

- Allowed.
- Required fields: email, phone, shipping address.
- On confirmation page, prompt "Create account?" — POST to `/api/auth/register-from-order` which links the order.

## Currency + money

- Storage: integer **paisa** (1 BDT = 100 paisa). Field type `Number`.
- Display: `formatBDT(paisa) → "৳1,250.00"`.
- Never use floats. Never store currency as string.

## Payment

- COD only for launch. No online gateway scaffolding.
- Order `paymentStatus` flow: `pending → paid` (set on delivery confirmation) or `failed` / `refunded`.

## Order state machine

```
placed → confirmed → packed → shipped → delivered
     ↘ cancelled (only from placed/confirmed within 2h)
                              ↘ returned (within 7d of delivered)
```

Transitions enforced in `src/lib/services/order-state.ts`. Invalid transitions throw.

## Inventory

- Stock at **variant** level, not product level.
- Decrement on order `placed` (not on cart-add), increment on `cancelled` / `returned`.
- Use Mongoose transactions for stock + order create.

## Coupons

- Codes are uppercase, unique, max 24 chars.
- Stacking: not allowed. One coupon per cart.
- Per-user limit enforced by counting orders containing that code.

## File uploads

- Cloudinary signed uploads only. Signature endpoint: `POST /api/uploads/sign`.
- Allowed: `image/jpeg`, `image/png`, `image/webp`, `image/avif`. Max 5 MB.
- Folder convention: `products/`, `reviews/`, `users/avatars/`, `banners/`.

## i18n

- Languages: `en`, `bn`. Default `en`.
- Library: `next-intl`. Locale routes are `[locale]` segment under `(shop)` once Phase 6 begins. Until then, copy lives in `src/lib/i18n/messages/{en,bn}.ts`.

## Email

- Provider: Resend.
- Templates: React Email in `src/emails/**`.
- From: `GlowCart <noreply@<domain>>`. Reply-to: `support@<domain>`.

## Search

- MVP: MongoDB Atlas Search (text index on `Product.name`, `Product.description`, `Product.brand`).
- Post-MVP: switch to Meilisearch — requires `src/lib/search/adapter.ts` to abstract.

## Time + dates

- Server stores UTC. Display in `Asia/Dhaka` (default) using `date-fns-tz`.
- All `createdAt`/`updatedAt` in ISO 8601.

## Versioning

- API surface considered stable after MVP. Breaking change → new path segment (`/api/v2/...`), never silent.

# 05 — Database Schema (Mongoose)

Source-of-truth shapes. Plan doc §4 has the high-level overview; this file adds index list, validators, and ownership notes.

All models live under `src/lib/db/models/<Name>.ts`. Each file exports a Mongoose model and an inferred TS type.

## Conventions

- Every collection has `createdAt`, `updatedAt` (Mongoose `timestamps: true`).
- Every monetary field is integer paisa (see contract §Currency).
- Refs use `mongoose.Schema.Types.ObjectId`, named `<entity>Id`.
- Soft-delete via `deletedAt: Date | null`. Default queries exclude where `deletedAt != null`.
- All slugs lowercased, kebab-case, unique.

## Models

### User

Indexes: `email` unique, `referralCode` unique sparse, `role` for admin filters.
Validators: email format (Zod at boundary, Mongoose match), phone E.164.

### Address

Indexes: `userId`, `(userId, isDefault)`.
Rule: setting `isDefault: true` clears the flag from siblings via pre-save hook.

### Category

Indexes: `slug` unique, `parentId` for tree queries.
Tree depth max 2 (category → subcategory). Enforce in validator.

### Product

Indexes:

- `slug` unique
- `categoryId`
- `tags` multikey
- text: `{ name: "text", description: "text", brand: "text" }` weighted 10/5/2
- `(isActive, isFeatured, createdAt)` compound for homepage queries
- `variants.sku` unique sparse multikey

### Cart

Indexes: `userId` unique.
TTL: none (carts persist).

### Wishlist

Indexes: `userId` unique.

### Order

Indexes: `userId`, `orderStatus`, `placedAt` desc, `orderNumber` unique.
`orderNumber` format: `GC-YYYYMMDD-XXXXX` (random base36 suffix).
Snapshots: name, image, sku, price for every line item — never resolved through `populate()` later.

### Review

Indexes: `(productId, isApproved)`, `userId`, `(productId, rating)`.
Constraint: one review per `(userId, productId, orderId)`.

### Coupon

Indexes: `code` unique upper, `validUntil` for cleanup.

### Banner

Indexes: `(isActive, order)` for homepage fetch.

### BlogPost

Indexes: `slug` unique, `(publishedAt, isPublished)`.

### NewsletterSubscriber

Indexes: `email` unique, `unsubscribedAt`.

### BackInStockRequest

Indexes: `(productId, variantId)`, `(userId, productId)` unique.
Drained when stock returns; emails sent in batch.

### ActivityLog

Indexes: `(actorId, createdAt)`, `(entity, entityId)`.
TTL: 365 days.

## Migrations

- Scripts under `scripts/migrate/<YYYYMMDD>-<slug>.ts`.
- Idempotent: every script checks current state before mutating.
- Tracked in a `migrations` collection: `{ name, ranAt }`.

## Seed

- `scripts/seed/index.ts` orchestrates. Sub-files per model.
- Default seed: 3 admin users, 8 categories, 50 products, 10 coupons, 20 reviews.
- Run via `pnpm db:seed`.

## Transactions

Required for: order placement (stock decrement + order create + cart clear), refund, role change.
Atlas free tier supports transactions — must use replica set connection string.

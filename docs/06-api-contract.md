# 06 — API Contract

Every route returns:

```ts
type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } };
```

Error codes are constants in `src/lib/constants.ts` under `ERROR_CODES`. No raw strings in handlers.

## Headers

| Header            | Required                    | Notes                                        |
| ----------------- | --------------------------- | -------------------------------------------- |
| `Authorization`   | only for service-to-service | Not used by browser; session cookie suffices |
| `x-csrf-token`    | mutating routes             | Double-submit with cookie                    |
| `Accept-Language` | optional                    | `en` default, `bn` supported                 |

## Pagination

```
?page=1&limit=24&sort=createdAt:desc
```

Response includes `data: { items: T[], page, limit, total, totalPages }`.

---

## Public / Customer routes

### Products

```
GET    /api/products
       ?q&category&brand&skinType&minPrice&maxPrice&badges&page&limit&sort
       → { items: ProductCard[], page, limit, total, totalPages }

GET    /api/products/[slug]
       → ProductDetail

GET    /api/products/[slug]/related
       → ProductCard[]   (max 8)
```

### Categories

```
GET    /api/categories                          → CategoryTree[]
GET    /api/categories/[slug]                   → Category & { products: ProductCard[] }
```

### Auth

```
POST   /api/auth/register     { name, email, password, referralCode? }
POST   /api/auth/forgot-password   { email }
POST   /api/auth/reset-password    { token, password }
POST   /api/auth/verify-email      { token }
GET    /api/auth/[...nextauth]     (NextAuth handler)
```

### Cart

```
GET    /api/cart                          → Cart
POST   /api/cart/items                    { productId, variantId, quantity }
PATCH  /api/cart/items/[itemId]           { quantity }
DELETE /api/cart/items/[itemId]
POST   /api/cart/coupon                   { code }
DELETE /api/cart/coupon
POST   /api/cart/clear
```

### Wishlist

```
GET    /api/wishlist                      → Wishlist
POST   /api/wishlist/toggle               { productId, variantId? }
```

### Addresses

```
GET    /api/addresses                     → Address[]
POST   /api/addresses                     AddressInput
PATCH  /api/addresses/[id]                Partial<AddressInput>
DELETE /api/addresses/[id]
POST   /api/addresses/[id]/default
```

### Orders

```
GET    /api/orders                        ?status&page → Order[]
GET    /api/orders/[id]                   → OrderDetail
POST   /api/orders                        { addressId, couponCode?, notes? }
POST   /api/orders/[id]/reorder           → { cart: Cart }
POST   /api/orders/[id]/cancel            { reason }
GET    /api/orders/[id]/invoice           → application/pdf
```

### Reviews

```
GET    /api/products/[slug]/reviews       ?page → Review[]
POST   /api/reviews                       { productId, orderId, rating, title, body, images?[] }
POST   /api/reviews/[id]/helpful
```

### User

```
GET    /api/user/profile                  → UserProfile
PATCH  /api/user/profile                  Partial<UserProfile>
POST   /api/user/avatar                   multipart → { url }
DELETE /api/user                          → cascading delete (GDPR)
```

### Misc

```
POST   /api/newsletter/subscribe          { email }
POST   /api/back-in-stock                 { productId, variantId }
POST   /api/uploads/sign                  → { signature, timestamp, folder, apiKey }
```

---

## Admin routes (`requireRole(['admin','manager','support'])`)

```
GET    /api/admin/dashboard/stats         ?from&to → DashboardStats
CRUD   /api/admin/products
POST   /api/admin/products/bulk-import    multipart csv
PATCH  /api/admin/products/[id]/stock     { variantId, delta, reason }
GET    /api/admin/orders                  ?status&q&page
PATCH  /api/admin/orders/[id]/status      { status, note?, trackingNumber?, courier? }
POST   /api/admin/orders/[id]/refund      { amount, reason }
CRUD   /api/admin/coupons
CRUD   /api/admin/banners
CRUD   /api/admin/blog
GET    /api/admin/customers               ?q&page
GET    /api/admin/customers/[id]          → CustomerDetail
GET    /api/admin/reviews                 ?status=pending → Review[]
PATCH  /api/admin/reviews/[id]            { isApproved, adminReply? }
GET    /api/admin/reports/sales           ?from&to&groupBy=day → SalesReport
GET    /api/admin/reports/sales.csv       → text/csv
GET    /api/admin/activity                ?actorId&entity → ActivityLog[]
```

## Server Actions (preferred for forms)

Every form on the customer side uses Server Actions, not fetch:

- `addToCartAction`
- `updateCartItemAction`
- `applyCouponAction`
- `placeOrderAction`
- `submitReviewAction`
- `updateProfileAction`
- `addAddressAction`

Actions live in `src/lib/actions/<domain>.ts`. Each:

1. Awaits `auth()` for session.
2. Validates input with Zod.
3. Performs the work in a service.
4. Returns the same `ApiResponse<T>` shape as routes.
5. Calls `revalidatePath` or `revalidateTag` as needed.

## Type contracts

All response types live in `src/types/api/<domain>.ts`. Frontend imports from `@/types/api/...`. Backend constructs them. Database models do not leak; always map to a DTO at the service boundary.

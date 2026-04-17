# Cosmetic E-Commerce Platform — Architecture & Feature Plan

**Stack:** Next.js 15 (App Router) · TypeScript · MongoDB + Mongoose · NextAuth.js · Tailwind CSS + shadcn/ui · COD payment

---

## 1. Complete Feature List

### 1.1 User-Requested Features (confirmed)

- User-scoped cart (DB-backed, no public/localStorage)
- User profile update
- Reorder system
- Wishlist
- Address book (multiple addresses per user)

### 1.2 Recommended Additional Features

#### Product & Catalog (cosmetic-specific)

- **Shade/variant selector** — lipstick shades, foundation undertones with swatch images
- **Ingredient list** with allergen flags (parabens, sulfates, fragrance)
- **Skin-type filters** — oily, dry, combination, sensitive, acne-prone
- **Product badges** — cruelty-free, vegan, paraben-free, dermatologist-tested
- **Expiry/batch tracking** per inventory unit
- **Before/after and swatch galleries**
- **"Find Your Shade" quiz** — strong conversion tool for foundation/concealer

#### Cart & Checkout

- Save-for-later (distinct from wishlist)
- Abandoned cart recovery (email reminder after 24h)
- Guest checkout with optional account creation at confirmation
- Gift wrapping + gift message option
- Coupon/promo code engine
- Free-shipping progress bar ("Add ৳200 more for free shipping")
- Order summary with estimated delivery date

#### Orders & Returns

- Order tracking with status timeline (placed → packed → shipped → delivered)
- Invoice PDF download
- Return/exchange requests with reason codes
- Order cancellation within defined window (e.g., 2 hours before ship)
- Partial reorder (reorder selected items from a past order)
- **Subscribe & Save** — auto-reorder every 30/60/90 days with discount

#### Reviews & Social Proof

- Photo and video reviews
- Verified-buyer badge
- Skin-type tags on reviews ("from a reviewer with oily skin")
- Q&A section per product
- Helpful-vote on reviews
- Admin moderation queue

#### Loyalty & Retention

- Points system (earn on purchase, redeem on checkout)
- Referral program with unique codes
- Tiered membership (Silver/Gold/Platinum)
- Birthday discount
- First-order discount for new signups

#### Search & Discovery

- Typo-tolerant search with autocomplete
- Faceted filters (price, brand, category, skin concern, skin type)
- "Recently viewed" list
- Personalized recommendations ("customers also bought")
- Trending and bestseller sections
- Related products on PDP

#### Notifications

- Email: order confirmation, shipping, delivery, abandoned cart
- SMS (optional): order status updates
- Back-in-stock alerts
- Price-drop alerts for wishlist items

#### Marketing & SEO

- Blog / editorial (skincare tips — excellent for beauty SEO)
- Structured data (Product, Review, Breadcrumb schemas)
- Dynamic meta tags per product
- Auto-generated sitemap
- Open Graph images per product
- Newsletter signup (Resend or Mailchimp)
- UTM tracking on campaign links

#### Admin Panel

- Dashboard (revenue, orders, top products, low-stock widgets)
- Bulk product import via CSV
- Inventory management with low-stock alerts
- Order management (status updates, refund processing)
- Customer management with full order history
- Discount / coupon creator
- Homepage CMS (banner / hero / featured-section manager)
- Sales reports with date filters and CSV export
- Role-based access (super-admin, manager, support)
- Activity log / audit trail

#### Technical Foundations

- Image optimization (Next.js `<Image>` + Cloudinary / UploadThing)
- Rate limiting on auth and checkout routes
- CSRF protection
- Zod input validation everywhere
- Sentry for error tracking
- PostHog or Plausible for analytics
- i18n-ready structure (Bangla + English)

---

## 2. Recommended Tech Stack

### 2.1 Core

| Layer          | Choice                                      | Reason                                           |
| -------------- | ------------------------------------------- | ------------------------------------------------ |
| Framework      | **Next.js 15 (App Router)**                 | Server Actions, RSC, streaming, SEO-friendly     |
| Language       | **TypeScript (strict)**                     | Type safety across client/server/API             |
| Database       | **MongoDB + Mongoose**                      | Confirmed — flexible schema for product variants |
| Auth           | **NextAuth.js v5**                          | Confirmed — credentials + Google/Facebook OAuth  |
| Styling        | **Tailwind CSS + shadcn/ui**                | Elegant, fully customizable base                 |
| Animation      | **Framer Motion**                           | Subtle interactions, page transitions            |
| Forms          | **React Hook Form + Zod**                   | Type-safe validation                             |
| State (client) | **Zustand**                                 | UI state only (cart stays in DB)                 |
| Data fetching  | **TanStack Query (v5)**                     | Client cache, mutations, optimistic updates      |
| Email          | **Resend + React Email**                    | Modern, developer-friendly                       |
| File uploads   | **UploadThing** or **Cloudinary**           | Images, review photos                            |
| Search         | **MongoDB Atlas Search** or **Meilisearch** | Full-text + typo tolerance                       |
| Caching        | **Redis (Upstash)**                         | Sessions, rate limit, product cache              |
| Monitoring     | **Sentry**                                  | Errors                                           |
| Analytics      | **PostHog**                                 | Product analytics + session replay               |
| Deployment     | **Vercel** + **MongoDB Atlas**              | Serverless-friendly                              |

### 2.2 Dev Tooling

- ESLint + Prettier
- Husky + lint-staged
- Vitest (unit) + Playwright (e2e)
- GitHub Actions for CI

---

## 3. Project Structure

```
cosmetic-ecommerce/
├── src/
│   ├── app/
│   │   ├── (shop)/                    # Customer-facing routes
│   │   │   ├── page.tsx               # Homepage
│   │   │   ├── products/
│   │   │   │   ├── page.tsx           # Product listing
│   │   │   │   └── [slug]/page.tsx    # Product detail (PDP)
│   │   │   ├── category/[slug]/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── account/
│   │   │   │   ├── profile/
│   │   │   │   ├── orders/
│   │   │   │   ├── addresses/
│   │   │   │   ├── wishlist/
│   │   │   │   └── reviews/
│   │   │   └── blog/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── admin/                     # Admin panel
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── customers/
│   │   │   ├── coupons/
│   │   │   ├── reviews/
│   │   │   ├── banners/
│   │   │   └── reports/
│   │   └── api/                       # API routes
│   │       ├── auth/[...nextauth]/
│   │       ├── products/
│   │       ├── cart/
│   │       ├── orders/
│   │       ├── wishlist/
│   │       ├── reviews/
│   │       └── admin/
│   ├── components/
│   │   ├── ui/                        # shadcn primitives
│   │   ├── shop/                      # ProductCard, CartDrawer, etc.
│   │   ├── admin/
│   │   └── shared/                    # Header, Footer, Newsletter
│   ├── lib/
│   │   ├── db/
│   │   │   ├── connect.ts             # Mongoose singleton
│   │   │   └── models/                # User, Product, Order, Cart, ...
│   │   ├── auth/
│   │   │   └── config.ts              # NextAuth config
│   │   ├── validators/                # Zod schemas
│   │   ├── actions/                   # Server Actions
│   │   ├── utils/
│   │   └── constants.ts
│   ├── hooks/
│   ├── emails/                        # React Email templates
│   ├── types/
│   └── middleware.ts                  # Route protection, rate limiting
├── public/
├── .env.local
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 4. Database Schema (Mongoose Models)

### 4.1 User

```ts
{
  _id, name, email (unique, indexed), passwordHash,
  phone, avatar, role: "customer" | "admin" | "manager" | "support",
  emailVerified, emailVerificationToken,
  passwordResetToken, passwordResetExpiry,
  dateOfBirth,                          // for birthday discount
  skinType: "oily" | "dry" | "combination" | "sensitive" | "normal",
  loyaltyPoints: Number,
  tier: "silver" | "gold" | "platinum",
  referralCode, referredBy,
  isActive, createdAt, updatedAt
}
```

### 4.2 Address (subdocument or separate collection)

```ts
{
  _id, userId (ref: User),
  label: "home" | "office" | "other",
  recipientName, phone,
  addressLine1, addressLine2,
  city, district, postalCode, country,
  isDefault: Boolean,
  createdAt, updatedAt
}
```

### 4.3 Category

```ts
{
  _id, name, slug (unique), description, image,
  parentId (self-ref for subcategories),
  order, isActive, seoMeta
}
```

### 4.4 Product

```ts
{
  _id, name, slug (unique, indexed),
  description, shortDescription,
  categoryId (ref), brand,
  images: [{ url, alt, order }],
  variants: [{
    _id, name,                          // "Shade 01 - Nude", "50ml"
    sku, price, comparePrice,
    stock, image, isActive
  }],
  basePrice, comparePrice,              // fallback if no variants
  ingredients: [String],
  allergens: [String],
  skinTypes: [String],
  badges: [String],                     // "cruelty-free", "vegan"
  tags: [String],
  rating: { avg, count },
  totalSold,
  isFeatured, isActive,
  seoMeta: { title, description, ogImage },
  createdAt, updatedAt
}
// Indexes: slug, categoryId, tags, text index on name+description
```

### 4.5 Cart

```ts
{
  _id, userId (ref, unique),            // one cart per user
  items: [{
    productId, variantId,
    quantity, priceSnapshot              // price at add-time
  }],
  couponCode, updatedAt
}
```

### 4.6 Wishlist

```ts
{
  _id, userId (ref, unique),
  items: [{ productId, variantId, addedAt }]
}
```

### 4.7 Order

```ts
{
  _id, orderNumber (human-readable),
  userId (ref),
  items: [{
    productId, variantId,
    name, image, sku,                   // snapshots
    price, quantity, subtotal
  }],
  shippingAddress: { ... },             // snapshot
  billingAddress: { ... },
  subtotal, discount, shippingFee, tax, total,
  couponCode,
  paymentMethod: "cod",
  paymentStatus: "pending" | "paid" | "failed" | "refunded",
  orderStatus: "placed" | "confirmed" | "packed" | "shipped"
                | "delivered" | "cancelled" | "returned",
  statusHistory: [{ status, note, changedBy, changedAt }],
  trackingNumber, courier,
  notes,
  placedAt, deliveredAt,
  createdAt, updatedAt
}
// Indexes: userId, orderStatus, placedAt
```

### 4.8 Review

```ts
{
  _id, productId (ref), userId (ref),
  orderId (ref, for verified badge),
  rating (1-5), title, body,
  images: [String],
  skinTypeAtReview,
  helpfulCount, isVerified, isApproved,
  adminReply, createdAt
}
```

### 4.9 Coupon

```ts
{
  _id, code (unique, uppercase),
  type: "percentage" | "fixed" | "free_shipping",
  value, minOrderAmount, maxDiscount,
  usageLimit, usedCount, perUserLimit,
  validFrom, validUntil,
  applicableCategories, applicableProducts,
  isActive
}
```

### 4.10 Supporting models

- **Banner** (homepage hero CMS)
- **BlogPost** (editorial)
- **NewsletterSubscriber**
- **BackInStockRequest**
- **ActivityLog** (admin audit)

---

## 5. Key API Routes (Server Actions preferred where possible)

### 5.1 Public / Customer

```
GET    /api/products              List with filters, pagination
GET    /api/products/[slug]       Product detail
GET    /api/categories
POST   /api/auth/register
POST   /api/auth/login            (via NextAuth)
GET    /api/cart                  Current user cart
POST   /api/cart/items            Add to cart
PATCH  /api/cart/items/[id]       Update quantity
DELETE /api/cart/items/[id]       Remove
POST   /api/cart/coupon           Apply coupon
GET    /api/wishlist
POST   /api/wishlist/toggle
GET    /api/addresses
POST   /api/addresses
PATCH  /api/addresses/[id]
DELETE /api/addresses/[id]
GET    /api/orders                User's orders
GET    /api/orders/[id]
POST   /api/orders                Place order (COD)
POST   /api/orders/[id]/reorder
POST   /api/orders/[id]/cancel
POST   /api/reviews
GET    /api/user/profile
PATCH  /api/user/profile
```

### 5.2 Admin (protected by role middleware)

```
GET    /api/admin/dashboard/stats
CRUD   /api/admin/products
POST   /api/admin/products/bulk-import
GET    /api/admin/orders
PATCH  /api/admin/orders/[id]/status
CRUD   /api/admin/coupons
CRUD   /api/admin/banners
GET    /api/admin/customers
GET    /api/admin/reviews          Moderation
GET    /api/admin/reports/sales
```

---

## 6. Authentication Flow (NextAuth v5)

- **Providers:** Credentials (email+password), Google, Facebook
- **Session strategy:** JWT (stateless, works well with serverless)
- **Middleware:** protects `/account/*`, `/checkout`, `/admin/*`
- **Role check:** `/admin/*` requires `role in ["admin", "manager", "support"]`
- **Password hashing:** bcrypt (12 rounds)
- **Email verification** on signup via Resend
- **Rate limiting** on login/register (Upstash Redis, 5/min per IP)

---

## 7. Elegant Design Direction

For the "elegant" feel the cosmetic category demands:

- **Typography:** Display serif for headings (e.g., _Playfair Display_, _Cormorant_, _Fraunces_), clean sans for body (_Inter_ or _Plus Jakarta Sans_)
- **Palette:** Soft neutrals (cream, blush, muted rose) with one deep accent (burgundy, forest, or noir). Avoid saturated primaries.
- **Spacing:** Generous whitespace, 1.6–1.8 line-height, larger-than-default section padding
- **Imagery:** High-res product shots on neutral backgrounds; avoid stock cosmetic cliché
- **Micro-interactions:** Subtle hover scales (1.02), fade-ins on scroll, smooth cart-drawer slide
- **Components:** Use shadcn/ui as the base, then restyle — pill buttons, thin borders, soft shadows

---

## 8. Phased Roadmap (suggested)

### Phase 1 — Foundation (Weeks 1–3)

Next.js setup, MongoDB connection, auth, base layout, design system, admin scaffold

### Phase 2 — Catalog (Weeks 4–6)

Product & category models, admin product CRUD, PDP, listing page with filters, search

### Phase 3 — Commerce Core (Weeks 7–10)

Cart, wishlist, addresses, checkout, COD order placement, order history, reorder

### Phase 4 — User Features (Weeks 11–13)

Profile, reviews, Q&A, notifications, email templates

### Phase 5 — Admin & Ops (Weeks 14–16)

Order management, inventory, coupons, banners/CMS, reports, bulk import

### Phase 6 — Growth (Weeks 17–19)

Loyalty points, referrals, blog, SEO polish, back-in-stock alerts, abandoned cart

### Phase 7 — Hardening & Launch (Weeks 20–22)

Performance audit, accessibility, Sentry, rate limiting, security review, e2e tests, launch

---

## 9. MVP Scope Recommendation

If you want to launch faster, the minimum viable cut is:

**Include in MVP:** Auth, product catalog, PDP with variants, cart, wishlist, addresses, checkout (COD), order history, reorder, profile update, basic admin (products + orders + inventory), reviews (text-only).

**Defer to post-launch:** Loyalty/referrals, subscribe-and-save, blog, advanced search, Q&A, video reviews, bulk CSV import, subscriptions.

---

## 10. Security & Compliance Checklist

- Input validation on every endpoint (Zod)
- Parameterized queries (Mongoose handles this)
- httpOnly, secure, sameSite cookies for sessions
- CSRF tokens on state-changing routes
- Rate limiting on auth, checkout, review submission
- Password complexity rules + breach check (optional via haveibeenpwned API)
- GDPR-style data export + delete account feature
- PII encryption at rest for phone numbers (optional)
- Admin actions logged in ActivityLog
- Image uploads scanned for size/type; no executables

---

**Next step:** Confirm MVP scope and I can scaffold the initial Next.js project with auth, DB connection, and base models ready to code against.

# 10 — MVP Scope

Locked feature set for the first launchable version. Anything not on the **In** list is post-launch.

## In

### Auth

- Email + password (NextAuth Credentials)
- Google OAuth
- Email verification
- Forgot / reset password
- Role: customer + admin

### Catalog

- Categories (2 levels max)
- Products with variants (shade, size)
- Ingredients, allergens, skin-type tags, badges
- Multiple images per product
- Listing page with filters: category, brand, skin type, price, badges
- PDP with variant selector
- Atlas Search keyword search + basic autocomplete
- Related products

### Commerce

- User cart (DB-backed)
- Wishlist
- Address book (multiple)
- Guest checkout + optional account creation at confirmation
- COD checkout
- Order history
- Order detail + status timeline
- Reorder (full order)
- Order cancellation (within 2h)
- Single coupon per cart

### User

- Profile edit (name, phone, DOB, skin type, avatar)
- Reviews (text + up to 3 images), verified badge
- Helpful vote
- GDPR account delete + data export

### Admin

- Dashboard (revenue, orders, top products, low stock)
- Product CRUD + image upload + variant management
- Inventory adjust + low-stock list
- Order list + status updates + tracking number
- Coupon CRUD
- Banner CRUD (homepage hero)
- Customer list + detail (read-only)
- Review moderation + admin reply
- Sales report (date range) + CSV export
- Role management

### Foundation

- Sentry, PostHog
- Rate limiting on auth, checkout, reviews
- CSRF
- Email: order placed, order shipped, order delivered, password reset, email verify
- Image optimization
- Sitemap + robots
- Basic structured data (Product, Breadcrumb)

## Out (post-launch)

- Subscribe & save / auto-reorder
- Loyalty points + tiers
- Referral program
- Birthday discount
- Find Your Shade quiz
- Q&A per product
- Video reviews
- Save-for-later (separate from wishlist)
- Abandoned cart email
- SMS notifications
- Back-in-stock alerts
- Price-drop alerts
- Blog / editorial
- Bulk product CSV import
- Meilisearch
- Multi-currency
- Bangla full localization (English-only at launch; structure i18n-ready)
- Multi-warehouse inventory
- Returns / exchange flow (manual via support email at launch)

## Acceptance

MVP ships when:

- All "In" features work end-to-end on staging.
- Lighthouse perf ≥ 90 on PDP and homepage.
- Lighthouse a11y ≥ 95 on all customer pages.
- Playwright suite green: signup, login, browse, add to cart, checkout (COD), reorder.
- Sentry DSN live and verified.
- Atlas backups configured (daily, 7-day retention).
- Domain + SSL on Vercel.
- Privacy policy + T&Cs published.

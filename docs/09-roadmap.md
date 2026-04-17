# 09 — Roadmap

Mirrors `documents/cosmetic-ecommerce-plan.md` §8, expanded with per-agent owners.

## Phase 0 — Docs & contracts (current, week 0)

- All docs in this folder.
- MVP scope confirmed by user.
- Agents instantiated.
  **Owner:** orchestrator.

## Phase 1 — Foundation (weeks 1–3)

- Next.js 15 + TS scaffold (devops).
- MongoDB connection + base models User/Category/Product (database).
- NextAuth v5 + middleware + role guard (security).
- Base layout, header, footer, design tokens, shadcn install (frontend).
- Admin shell route + role redirect (frontend + security).
- CI: typecheck, lint, vitest (devops + qa).
- Sentry + PostHog wiring (devops).

## Phase 2 — Catalog (weeks 4–6)

- Product CRUD admin + image upload (backend + frontend).
- Variant editor (frontend).
- PDP with shade selector, ingredients, badges (frontend).
- Listing page with filters, pagination, sort (frontend + backend).
- Atlas Search index + autocomplete (database + backend).
- Category tree pages (frontend + backend).

## Phase 3 — Commerce core (weeks 7–10)

- Cart Server Actions + drawer (backend + frontend).
- Wishlist toggle (backend + frontend).
- Address book (backend + frontend).
- Checkout flow (frontend) + order placement transaction (backend + database).
- COD order email (backend + frontend templates).
- Order history + reorder + cancel (backend + frontend).
- Coupons engine (backend).

## Phase 4 — User features (weeks 11–13)

- Profile edit, avatar upload (backend + frontend).
- Reviews (text + image) + helpful vote (backend + frontend).
- Q&A per product (backend + frontend).
- Email templates: order confirmed, shipped, delivered, abandoned cart (frontend).
- Notification preferences (backend + frontend).

## Phase 5 — Admin & ops (weeks 14–16)

- Order status updates with timeline (backend + frontend).
- Inventory low-stock alerts + bulk CSV import (backend + database).
- Coupon creator (frontend + backend).
- Banner CMS (frontend + backend).
- Sales report + CSV export (backend).
- Activity log surface (frontend).
- Role management UI (frontend + security).

## Phase 6 — Growth (weeks 17–19)

- Loyalty points (backend + database).
- Referral codes (backend + frontend).
- Blog/editorial (backend + frontend).
- SEO: sitemap, OG, structured data (frontend + devops).
- Back-in-stock alerts batch (backend).
- Abandoned cart cron (backend + devops).
- i18n: Bangla copy pass (frontend).

## Phase 7 — Hardening & launch (weeks 20–22)

- Performance audit, image optimization, font subset (frontend + devops).
- Accessibility pass (frontend + qa).
- Security review + pen test fixes (security + qa).
- Rate limit verification (security).
- Playwright e2e suite expansion (qa).
- Load test on Atlas + Vercel (devops).
- Launch runbook + on-call rotation (devops).

## Post-launch backlog (not in MVP timeline)

- Subscribe & save
- Tiered membership
- Birthday discount
- Find Your Shade quiz
- Video reviews
- SMS notifications
- Meilisearch migration
- Mobile app (React Native)

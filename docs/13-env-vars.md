# 13 — Environment Variables

Single source of truth. `.env.example` mirrors this file (no values).

## Required (all environments)

```bash
# Core
NODE_ENV=development|production
NEXT_PUBLIC_APP_URL=http://localhost:3000        # public origin

# Database
MONGODB_URI=mongodb+srv://...
MONGODB_DB=cosmetic_dev

# NextAuth
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# Email
RESEND_API_KEY=re_...
EMAIL_FROM="GlowCart <noreply@example.com>"
EMAIL_REPLY_TO=support@example.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=             # mirror, used by client uploader

# Redis (rate limit, cache)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Observability
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=                              # for source map upload
SENTRY_ORG=
SENTRY_PROJECT=

NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Optional

```bash
# Search (when migrating off Atlas Search)
MEILISEARCH_HOST=
MEILISEARCH_API_KEY=

# Feature flags
ENABLE_REVIEWS=true
ENABLE_WISHLIST=true
ENABLE_LOYALTY=false

# Cron auth (Vercel Cron header)
CRON_SECRET=

# Admin bootstrap (first-run seed)
ADMIN_BOOTSTRAP_EMAIL=
ADMIN_BOOTSTRAP_PASSWORD=
```

## Per-environment differences

| Var              | local          | preview            | production        |
| ---------------- | -------------- | ------------------ | ----------------- |
| `NEXTAUTH_URL`   | localhost:3000 | per-PR Vercel URL  | apex domain       |
| `MONGODB_DB`     | `cosmetic_dev` | `cosmetic_preview` | `cosmetic_prod`   |
| `EMAIL_FROM`     | dev sandbox    | dev sandbox        | production sender |
| Cloudinary cloud | `glowcart-dev` | `glowcart-dev`     | `glowcart-prod`   |

## Validation

Parsed at boot via `src/lib/env.ts` using Zod:

```ts
export const env = envSchema.parse(process.env);
```

Boot fails loudly if a required var is missing. Frontend can only access `NEXT_PUBLIC_*` vars; server-side imports the typed `env` object.

## Setting in Vercel

```bash
vercel env add MONGODB_URI production
vercel env add MONGODB_URI preview
```

Pull to local with `vercel env pull .env.local`.

## Rotation log

Track in `docs/postmortems/secrets-rotation.md`:

- Resend API key
- Cloudinary API secret
- NextAuth secret
- OAuth client secrets
- Upstash token

Rotate on schedule (quarterly) or immediately on suspected leak.

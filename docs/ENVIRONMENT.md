# Environment variables

## Required (production)

**Auth.js**
- `NEXTAUTH_URL` (production domain)
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Database**
- `DATABASE_URL`

## Optional (feature-gated)

**OpenAI (generation)**
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4.1`)

**Stripe (billing)**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_FULL_ACCESS`

**Upstash Redis (rate limiting)**
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

**Cloudinary (uploads)**
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**Admin**
- `ADMIN_EMAIL_ALLOWLIST` (comma-separated)


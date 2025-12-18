# Deployment (Vercel + Supabase)

## Vercel settings

- **Production URL**: `https://social-media-content-generator-seven.vercel.app`
- **Build Command** (recommended):
  - `npx prisma migrate deploy && npx prisma generate && npm run build`

## Prisma workflow

- Local dev schema changes:
  - `npx prisma migrate dev --name <change_name>`
  - Commit `prisma/migrations/*` and `prisma/schema.prisma`
- Production deploy:
  - Vercel runs `prisma migrate deploy` during build to apply committed migrations.

## Stripe webhooks

- Create a Stripe webhook destination pointing to:
  - `https://social-media-content-generator-seven.vercel.app/api/stripe/webhook`
- Add the destination **Signing secret** to `STRIPE_WEBHOOK_SECRET` in Vercel.

## Email verification

Email verification links are currently logged to server console.
When you add a transactional provider later, wire it in `src/app/api/auth/register/route.ts`.


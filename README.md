Social Media Magic Generator (Lexus-branded) — subscription SaaS that generates social media content for businesses and learns per account via accept/reject feedback.

## Getting Started

### 1) Install

```bash
npm install
```

### 2) Configure env vars

Copy the example file:

```bash
cp .env.example .env.local
```

Fill in `.env.local` with:
- Firebase web config (`NEXT_PUBLIC_FIREBASE_*`)
- Firebase Admin service account (`FIREBASE_ADMIN_*`)
- Supabase Postgres (`DATABASE_URL`)
- Stripe (`STRIPE_*`)
- OpenAI (`OPENAI_*`)
- Upstash (optional)
- Cloudinary (`CLOUDINARY_*`)

To enable the admin dashboard, set `ADMIN_EMAIL_ALLOWLIST` to a comma-separated list of emails.

### 3) Database migrations

```bash
npx prisma migrate dev
```

### 4) Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## App flow (MVP)

- Sign up (3-day trial, no payment required during trial)
- Complete Brand Profile
- Generate content (Facebook / Instagram / Pinterest / X)
- Review in the Generated library and Accept/Reject with a reason
- Accepted/Rejected libraries retain results; feedback updates per-account AI memory

## Stripe webhooks

Set your Stripe webhook endpoint to:

`/api/stripe/webhook`

Then configure `STRIPE_WEBHOOK_SECRET` in `.env.local`.

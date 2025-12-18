import { NextResponse } from "next/server";

import { requireAuthedUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env/server";
import { getStripe } from "@/lib/stripe";
import { getOrCreateTenantForUser } from "@/lib/tenant";

export async function POST(req: Request) {
  try {
    const authed = await requireAuthedUser();
    const { account } = await getOrCreateTenantForUser(authed);
    const env = getServerEnv();
    const stripe = getStripe();

    const origin = req.headers.get("origin") ?? "http://localhost:3000";

    const customerId =
      account.billingCustomerId ??
      (
        await stripe.customers.create({
          email: authed.email,
          metadata: { accountId: account.id },
        })
      ).id;

    if (!account.billingCustomerId) {
      await prisma.account.update({
        where: { id: account.id },
        data: { billingCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: account.id,
      line_items: [{ price: env.STRIPE_PRICE_ID_FULL_ACCESS, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/app/billing?success=1`,
      cancel_url: `${origin}/app/billing?canceled=1`,
      subscription_data: {
        metadata: { accountId: account.id },
      },
      metadata: { accountId: account.id },
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

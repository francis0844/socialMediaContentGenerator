import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env/server";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const authedSession = await requireSession();
    const account = await prisma.account.findUniqueOrThrow({
      where: { id: authedSession.accountId },
    });
    const env = getServerEnv();
    if (!env.STRIPE_PRICE_ID_FULL_ACCESS) throw new Error("STRIPE_NOT_CONFIGURED");
    const stripe = getStripe();

    if (account.billingStatus === "active" && account.billingSubscriptionId) {
      return NextResponse.json(
        { ok: false, error: "ALREADY_SUBSCRIBED" },
        { status: 400 },
      );
    }

    const origin = req.headers.get("origin") ?? "http://localhost:3000";

    const customerId =
      account.billingCustomerId ??
      (
        await stripe.customers.create({
          email: authedSession.user.email ?? undefined,
          metadata: { accountId: account.id },
        })
      ).id;

    if (!account.billingCustomerId) {
      await prisma.account.update({
        where: { id: account.id },
        data: { billingCustomerId: customerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
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

    return NextResponse.json({ ok: true, url: checkoutSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

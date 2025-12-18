import { NextResponse } from "next/server";

import { requireAuthedUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { getOrCreateTenantForUser } from "@/lib/tenant";

export async function POST(req: Request) {
  try {
    const authed = await requireAuthedUser();
    const { account } = await getOrCreateTenantForUser(authed);
    const stripe = getStripe();

    if (!account.billingCustomerId) {
      return NextResponse.json(
        { ok: false, error: "NO_CUSTOMER" },
        { status: 400 },
      );
    }

    const origin = req.headers.get("origin") ?? "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: account.billingCustomerId,
      return_url: `${origin}/app/billing`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}


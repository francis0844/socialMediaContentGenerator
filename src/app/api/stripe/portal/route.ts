import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const authedSession = await requireSession();
    const account = await prisma.account.findUniqueOrThrow({
      where: { id: authedSession.accountId },
    });
    const stripe = getStripe();

    if (!account.billingCustomerId) {
      return NextResponse.json({ ok: false, error: "NO_CUSTOMER" }, { status: 400 });
    }

    const origin = req.headers.get("origin") ?? "http://localhost:3000";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: account.billingCustomerId,
      return_url: `${origin}/app/billing`,
    });

    return NextResponse.json({ ok: true, url: portalSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

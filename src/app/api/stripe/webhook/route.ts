import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env/server";
import { getStripe, mapStripeSubscriptionStatus } from "@/lib/stripe";
import { log } from "@/lib/observability/log";

export async function POST(req: Request) {
  const env = getServerEnv();
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "STRIPE_NOT_CONFIGURED" }, { status: 500 });
  }
  const stripe = getStripe();

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "MISSING_SIGNATURE" }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "INVALID_SIGNATURE";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  try {
    log("info", "stripe.webhook.received", { type: event.type, id: event.id });
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const accountId =
          session.client_reference_id ?? session.metadata?.accountId ?? null;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;
        const customerId = typeof session.customer === "string" ? session.customer : null;

        if (accountId && subscriptionId && customerId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const item = sub.items.data[0] ?? null;
          await prisma.account.update({
            where: { id: accountId },
            data: {
              billingCustomerId: customerId,
              billingSubscriptionId: subscriptionId,
              billingStatus: mapStripeSubscriptionStatus(sub.status),
              billingPeriodStart: item ? new Date(item.current_period_start * 1000) : null,
              billingPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
            },
          });
          log("info", "stripe.webhook.synced", {
            accountId,
            subscriptionId,
            status: sub.status,
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const accountId =
          sub.metadata?.accountId ??
          (await prisma.account
            .findFirst({
              where: { billingSubscriptionId: sub.id },
              select: { id: true },
            })
            .then((a) => a?.id ?? null));

        if (accountId) {
          const item = sub.items.data[0] ?? null;
          await prisma.account.update({
            where: { id: accountId },
            data: {
              billingCustomerId:
                typeof sub.customer === "string" ? sub.customer : undefined,
              billingSubscriptionId: sub.id,
              billingStatus: mapStripeSubscriptionStatus(sub.status),
              billingPeriodStart: item ? new Date(item.current_period_start * 1000) : null,
              billingPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
            },
          });
          log("info", "stripe.webhook.synced", {
            accountId,
            subscriptionId: sub.id,
            status: sub.status,
          });
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "WEBHOOK_FAILED";
    log("error", "stripe.webhook.error", { error: message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

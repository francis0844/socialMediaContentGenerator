import "server-only";

import Stripe from "stripe";

import { getServerEnv } from "@/lib/env/server";

export function getStripe() {
  const env = getServerEnv();
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  return new Stripe(env.STRIPE_SECRET_KEY);
}

export function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
      return "active" as const;
    case "trialing":
      return "trialing" as const;
    case "past_due":
      return "past_due" as const;
    case "canceled":
      return "canceled" as const;
    case "incomplete":
    case "incomplete_expired":
      return "incomplete" as const;
    case "unpaid":
      return "unpaid" as const;
    default:
      return "active" as const;
  }
}

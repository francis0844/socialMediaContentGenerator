import "server-only";

import { prisma } from "@/lib/db";

const TRIAL_DAYS = 3;

export async function ensureAccountForUser(userId: string) {
  const existing = await prisma.membership.findFirst({
    where: { userId },
    select: { accountId: true },
  });
  if (existing) return existing.accountId;

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const account = await prisma.account.create({
    data: {
      name: "My Business",
      billingStatus: "trialing",
      trialEndsAt,
      memberships: { create: { userId, role: "OWNER" } },
      aiMemory: { create: { memorySummary: "" } },
    },
  });

  return account.id;
}

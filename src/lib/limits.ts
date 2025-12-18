import "server-only";

import { prisma } from "@/lib/db";

export const MONTHLY_GENERATION_LIMIT = 1000;

export function isTrialActive(trialEndsAt: Date | null) {
  if (!trialEndsAt) return false;
  return trialEndsAt.getTime() > Date.now();
}

export function hasPaidAccess(params: {
  billingStatus: string;
  trialEndsAt: Date | null;
}) {
  if (isTrialActive(params.trialEndsAt)) return true;
  return params.billingStatus === "active";
}

export async function assertWithinMonthlyLimit(accountId: string) {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const count = await prisma.generationRequest.count({
    where: { accountId, createdAt: { gte: startOfMonth } },
  });

  if (count >= MONTHLY_GENERATION_LIMIT) {
    throw new Error("MONTHLY_LIMIT_REACHED");
  }
}

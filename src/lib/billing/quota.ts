import "server-only";

import { prisma } from "@/lib/db";

export const BILLING_CYCLE_GENERATION_LIMIT = 1000;
export const TRIAL_DAILY_GENERATION_LIMIT = 15;

export function isTrialActive(trialEndsAt: Date | null) {
  if (!trialEndsAt) return false;
  return trialEndsAt.getTime() > Date.now();
}

export function hasGenerationAccess(params: {
  billingStatus: string;
  trialEndsAt: Date | null;
}) {
  if (isTrialActive(params.trialEndsAt)) return true;
  return params.billingStatus === "active";
}

export function startOfTodayUtc() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function assertWithinTrialDailyLimit(accountId: string) {
  const start = startOfTodayUtc();
  const used = await prisma.generationRequest.count({
    where: { accountId, createdAt: { gte: start } },
  });
  if (used >= TRIAL_DAILY_GENERATION_LIMIT) {
    throw new Error("TRIAL_DAILY_LIMIT_REACHED");
  }
  return { used, limit: TRIAL_DAILY_GENERATION_LIMIT };
}

export async function assertWithinBillingCycleLimit(params: {
  accountId: string;
  periodStart: Date | null;
}) {
  const start = params.periodStart ?? new Date(0);
  const used = await prisma.generationRequest.count({
    where: { accountId: params.accountId, createdAt: { gte: start } },
  });
  if (used >= BILLING_CYCLE_GENERATION_LIMIT) {
    throw new Error("BILLING_CYCLE_LIMIT_REACHED");
  }
  return { used, limit: BILLING_CYCLE_GENERATION_LIMIT };
}


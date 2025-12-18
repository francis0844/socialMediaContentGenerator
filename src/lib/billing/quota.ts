import "server-only";

import { prisma } from "@/lib/db";

export const MONTHLY_GENERATION_LIMIT = 1000;
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

export function startOfMonthUtc() {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function startOfNextMonthUtc() {
  const d = startOfMonthUtc();
  d.setUTCMonth(d.getUTCMonth() + 1);
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

export async function assertWithinMonthlyLimit(accountId: string) {
  const start = startOfMonthUtc();
  const used = await prisma.generationRequest.count({
    where: { accountId, createdAt: { gte: start } },
  });
  if (used >= MONTHLY_GENERATION_LIMIT) {
    throw new Error("MONTHLY_LIMIT_REACHED");
  }
  return { used, limit: MONTHLY_GENERATION_LIMIT };
}

import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import {
  BILLING_CYCLE_GENERATION_LIMIT,
  TRIAL_DAILY_GENERATION_LIMIT,
  isTrialActive,
  startOfTodayUtc,
} from "@/lib/billing/quota";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireSession();
    const account = await prisma.account.findUniqueOrThrow({
      where: { id: session.accountId },
    });

    const [generatedCount, acceptedCount, rejectedCount] = await Promise.all([
      prisma.generatedContent.count({
        where: { accountId: account.id, status: "generated" },
      }),
      prisma.generatedContent.count({
        where: { accountId: account.id, status: "accepted" },
      }),
      prisma.generatedContent.count({
        where: { accountId: account.id, status: "rejected" },
      }),
    ]);

    const trialActive = isTrialActive(account.trialEndsAt);
    const trialDaysLeft = account.trialEndsAt
      ? Math.max(
          0,
          Math.ceil((account.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
        )
      : null;

    const [trialDailyUsed, cycleUsed] = await Promise.all([
      trialActive
        ? prisma.generationRequest.count({
            where: { accountId: account.id, createdAt: { gte: startOfTodayUtc() } },
          })
        : Promise.resolve(0),
      prisma.generationRequest.count({
        where: {
          accountId: account.id,
          createdAt: { gte: account.billingPeriodStart ?? new Date(0) },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      counts: {
        generated: generatedCount,
        accepted: acceptedCount,
        rejected: rejectedCount,
      },
      quota: trialActive
        ? {
            scope: "trial_daily",
            used: trialDailyUsed,
            limit: TRIAL_DAILY_GENERATION_LIMIT,
            resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }
        : {
            scope: "billing_cycle",
            used: cycleUsed,
            limit: BILLING_CYCLE_GENERATION_LIMIT,
            periodStart: account.billingPeriodStart?.toISOString() ?? null,
            periodEnd: account.billingPeriodEnd?.toISOString() ?? null,
          },
      billingStatus: account.billingStatus,
      trialEndsAt: account.trialEndsAt?.toISOString() ?? null,
      trialDaysLeft,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

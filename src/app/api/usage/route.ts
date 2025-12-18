import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import {
  MONTHLY_GENERATION_LIMIT,
  TRIAL_DAILY_GENERATION_LIMIT,
  isTrialActive,
  startOfMonthUtc,
  startOfNextMonthUtc,
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

    const platforms = ["facebook", "instagram", "pinterest", "x"] as const;
    const platformCounts: Record<(typeof platforms)[number], number> = {
      facebook: 0,
      instagram: 0,
      pinterest: 0,
      x: 0,
    };

    const platformCountsRaw = await prisma.generationRequest.groupBy({
      by: ["platform"],
      _count: true,
      where: { accountId: account.id },
    });
    for (const row of platformCountsRaw) {
      if (platforms.includes(row.platform as (typeof platforms)[number])) {
        platformCounts[row.platform as (typeof platforms)[number]] = row._count;
      }
    }

    const trialActive = isTrialActive(account.trialEndsAt);
    const trialDaysLeft = account.trialEndsAt
      ? Math.max(
          0,
          Math.ceil((account.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
        )
      : null;

    const [trialDailyUsed, monthUsed] = await Promise.all([
      trialActive
        ? prisma.generationRequest.count({
            where: { accountId: account.id, createdAt: { gte: startOfTodayUtc() } },
          })
        : Promise.resolve(0),
      prisma.generationRequest.count({
        where: {
          accountId: account.id,
          createdAt: { gte: startOfMonthUtc() },
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
      platformCounts,
      quota: trialActive
        ? {
            scope: "trial_daily",
            used: trialDailyUsed,
            limit: TRIAL_DAILY_GENERATION_LIMIT,
            resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }
        : {
            scope: "monthly",
            used: monthUsed,
            limit: MONTHLY_GENERATION_LIMIT,
            monthStart: startOfMonthUtc().toISOString(),
            monthEnd: startOfNextMonthUtc().toISOString(),
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

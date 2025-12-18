import { NextResponse } from "next/server";

import { requireAuthedUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrCreateTenantForUser } from "@/lib/tenant";

export async function GET() {
  try {
    const authed = await requireAuthedUser();
    const { account } = await getOrCreateTenantForUser(authed);

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

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const monthGenerations = await prisma.generationRequest.count({
      where: { accountId: account.id, createdAt: { gte: startOfMonth } },
    });

    const trialDaysLeft = account.trialEndsAt
      ? Math.max(
          0,
          Math.ceil(
            (account.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
          ),
        )
      : null;

    return NextResponse.json({
      ok: true,
      counts: {
        generated: generatedCount,
        accepted: acceptedCount,
        rejected: rejectedCount,
      },
      monthGenerations,
      monthLimit: 1000,
      billingStatus: account.billingStatus,
      trialEndsAt: account.trialEndsAt?.toISOString() ?? null,
      trialDaysLeft,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }
}

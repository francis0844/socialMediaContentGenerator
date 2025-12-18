import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
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

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const monthGenerations = await prisma.generationRequest.count({
      where: { accountId: account.id, createdAt: { gte: startOfMonth } },
    });

    const trialDaysLeft = account.trialEndsAt
      ? Math.max(
          0,
          Math.ceil((account.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
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
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

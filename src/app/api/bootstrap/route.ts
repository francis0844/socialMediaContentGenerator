import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth/admin";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireSession();
    const account = await prisma.account.findUniqueOrThrow({
      where: { id: session.accountId },
    });

    const trialDaysLeft = account.trialEndsAt
      ? Math.max(
          0,
          Math.ceil((account.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
        )
      : null;

    return NextResponse.json({
      ok: true,
      user: {
        email: session.user.email,
        isAdmin: isAdminEmail(session.user.email),
        emailVerified: session.user.emailVerified,
      },
      account: {
        id: account.id,
        name: account.name,
        plan: account.plan,
        billingStatus: account.billingStatus,
        trialEndsAt: account.trialEndsAt?.toISOString() ?? null,
        trialDaysLeft,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

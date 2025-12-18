import { NextResponse } from "next/server";

import { requireAuthedUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminEmail } from "@/lib/tenant";

export async function GET() {
  try {
    const authed = await requireAuthedUser();
    if (!isAdminEmail(authed.email)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { memberships: { include: { user: true } } },
    });

    return NextResponse.json({
      ok: true,
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        plan: a.plan,
        billingStatus: a.billingStatus,
        trialEndsAt: a.trialEndsAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
        members: a.memberships.map((m) => ({
          email: m.user.email,
          role: m.role,
        })),
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

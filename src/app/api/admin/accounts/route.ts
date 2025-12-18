import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth/admin";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireSession();
    if (!isAdminEmail(session.user.email)) {
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

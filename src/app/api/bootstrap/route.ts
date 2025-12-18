import { NextResponse } from "next/server";

import { requireAuthedUser } from "@/lib/auth";
import { getOrCreateTenantForUser, isAdminEmail } from "@/lib/tenant";

export async function GET() {
  try {
    const authed = await requireAuthedUser();
    const { account } = await getOrCreateTenantForUser(authed);

    const trialDaysLeft = account.trialEndsAt
      ? Math.max(
          0,
          Math.ceil((account.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
        )
      : null;

    return NextResponse.json({
      ok: true,
      user: { email: authed.email, isAdmin: isAdminEmail(authed.email) },
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
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }
}

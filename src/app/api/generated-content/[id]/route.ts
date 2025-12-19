import { NextRequest, NextResponse } from "next/server";

import { requireVerifiedSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireVerifiedSession();
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID_REQUIRED" }, { status: 400 });
    }
    const content = await prisma.generatedContent.findUnique({
      where: { id },
      select: {
        id: true,
        accountId: true,
        imageStatus: true,
        imageError: true,
        primaryImageAsset: { select: { url: true } },
      },
    });
    if (!content || content.accountId !== session.accountId) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      id: content.id,
      imageStatus: content.imageStatus,
      primaryImageUrl: content.primaryImageAsset?.url ?? null,
      imageError: content.imageError ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireSession();

    const feedback = await prisma.feedback.findMany({
      where: { accountId: session.accountId, undoneAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        content: {
          select: {
            title: true,
            request: { select: { platform: true, contentType: true } },
          },
        },
      },
      take: 100,
    });

    return NextResponse.json({
      ok: true,
      items: feedback.map((f) => ({
        id: f.id,
        decision: f.decision,
        reason: f.reason,
        aiResponse: f.aiResponse,
        createdAt: f.createdAt.toISOString(),
        title: f.content?.title ?? null,
        platform: f.content?.request?.platform ?? null,
        contentType: f.content?.request?.contentType ?? null,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

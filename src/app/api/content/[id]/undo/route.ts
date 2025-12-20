import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { log } from "@/lib/observability/log";

const bodySchema = z.object({
  reason: z.string().min(2).max(500).optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json().catch(() => ({})));

    const content = await prisma.generatedContent.findFirst({
      where: { id, accountId: session.accountId },
      select: { id: true, status: true },
    });
    if (!content) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    if (content.status === "generated") {
      return NextResponse.json({ ok: true });
    }

    const lastFeedback = await prisma.feedback.findFirst({
      where: {
        accountId: session.accountId,
        contentId: id,
        undoneAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!lastFeedback) {
      return NextResponse.json(
        { ok: false, error: "UNDO_NOT_AVAILABLE" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.generatedContent.update({
        where: { id },
        data: { status: "generated" },
      });

      if (lastFeedback.previousMemorySnapshot !== null) {
        await tx.account.update({
          where: { id: session.accountId },
          data: { memorySummary: lastFeedback.previousMemorySnapshot ?? "" },
        });
      }

      await tx.feedback.update({
        where: { id: lastFeedback.id },
        data: {
          undoneAt: new Date(),
          undoReason: body.reason ?? "Undo decision",
        },
      });
    });

    log("info", "ai.feedback.undone", {
      accountId: session.accountId,
      contentId: id,
      decision: lastFeedback.decision,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

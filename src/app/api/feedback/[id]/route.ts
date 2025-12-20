import { NextRequest, NextResponse } from "next/server";

import { removeMemoryPreference } from "@/lib/ai/memory";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { log } from "@/lib/observability/log";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID_REQUIRED" }, { status: 400 });
    }

    const feedback = await prisma.feedback.findFirst({
      where: { id, accountId: session.accountId },
      include: { content: { include: { request: true } } },
    });
    if (!feedback) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    if (feedback.undoneAt) {
      return NextResponse.json({ ok: false, error: "ALREADY_REMOVED" }, { status: 400 });
    }

    const account = await prisma.account.findUniqueOrThrow({
      where: { id: session.accountId },
      select: { memorySummary: true },
    });

    const memoryUpdate = await removeMemoryPreference({
      previousSummary: account.memorySummary ?? "",
      decision: feedback.decision,
      reason: feedback.reason,
      contentType: feedback.content.request.contentType,
      platform: feedback.content.request.platform,
      outputJson: feedback.content.output,
    });

    await prisma.$transaction(async (tx) => {
      await tx.feedback.update({
        where: { id: feedback.id },
        data: { undoneAt: new Date(), undoReason: "Preference removed by user" },
      });
      await tx.account.update({
        where: { id: session.accountId },
        data: { memorySummary: memoryUpdate.memorySummary },
      });
    });

    log("info", "ai.feedback.removed", { accountId: session.accountId, feedbackId: feedback.id });

    return NextResponse.json({
      ok: true,
      aiResponse: memoryUpdate.aiResponse,
      updatedMemorySummary: memoryUpdate.memorySummary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    log("error", "ai.feedback.remove_error", { error: message });
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

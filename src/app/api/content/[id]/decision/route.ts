import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { updateMemorySummary } from "@/lib/ai/memory";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { log } from "@/lib/observability/log";
import { getRatelimit } from "@/lib/ratelimit";

const bodySchema = z.object({
  decision: z.enum(["accept", "reject"]),
  reason: z.string().min(2).max(500),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();

    const rate = getRatelimit();
    if (rate) {
      const rl = await rate.limit(`fb:${session.user.id}`);
      if (!rl.success) {
        return NextResponse.json({ ok: false, error: "RATE_LIMITED" }, { status: 429 });
      }
    }

    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());

    const content = await prisma.generatedContent.findFirst({
      where: { id, accountId: session.accountId },
      include: { request: true },
    });
    if (!content) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const account = await prisma.account.findUniqueOrThrow({
      where: { id: session.accountId },
      select: { memorySummary: true },
    });
    const prevMemory = account.memorySummary ?? "";

    const memoryUpdate = await updateMemorySummary({
      previousSummary: prevMemory,
      decision: body.decision,
      reason: body.reason,
    });
    const updatedSummary = memoryUpdate.memorySummary;
    const aiResponse = memoryUpdate.aiResponse;

    await prisma.$transaction(async (tx) => {
      await tx.generatedContent.update({
        where: { id: content.id },
        data: { status: body.decision === "accept" ? "accepted" : "rejected" },
      });

      await tx.feedback.create({
        data: {
          accountId: session.accountId,
          contentId: content.id,
          decision: body.decision,
          reason: body.reason,
          aiResponse,
          previousMemorySnapshot: prevMemory,
          memorySnapshot: updatedSummary,
        },
      });

      await tx.account.update({
        where: { id: session.accountId },
        data: { memorySummary: updatedSummary },
      });
    });

    log("info", "ai.feedback.applied", {
      accountId: session.accountId,
      contentId: content.id,
      decision: body.decision,
    });

    return NextResponse.json({
      ok: true,
      aiResponse,
      updatedMemorySummary: updatedSummary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    log("error", "ai.feedback.error", { error: message });
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

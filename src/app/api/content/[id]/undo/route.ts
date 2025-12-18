import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

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

    if (!lastFeedback?.previousMemorySnapshot) {
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

      await tx.aiMemory.upsert({
        where: { accountId: session.accountId },
        update: { memorySummary: lastFeedback.previousMemorySnapshot ?? "" },
        create: {
          accountId: session.accountId,
          memorySummary: lastFeedback.previousMemorySnapshot ?? "",
        },
      });

      await tx.feedback.update({
        where: { id: lastFeedback.id },
        data: {
          undoneAt: new Date(),
          undoReason: body.reason ?? "Undo decision",
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}


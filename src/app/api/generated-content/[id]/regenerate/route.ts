import { NextRequest, NextResponse } from "next/server";

import { requireVerifiedSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { enqueueImageJob } from "@/lib/queue/imageQueue";

export async function POST(req: NextRequest, context: any) {
  try {
    const session = await requireVerifiedSession();
    const id = context?.params?.id as string;

    const content = await prisma.generatedContent.findUnique({
      where: { id },
      include: { request: true },
    });
    if (!content || content.accountId !== session.accountId) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    if (content.request.contentType !== "graphic") {
      return NextResponse.json({ ok: false, error: "NOT_GRAPHIC" }, { status: 400 });
    }

    const job = await prisma.$transaction(async (tx) => {
      await tx.generatedContent.update({
        where: { id: content.id },
        data: { imageStatus: "generating", imageError: null },
      });

      const existing = await tx.imageJob.findFirst({
        where: { generatedContentId: content.id },
        select: { id: true },
      });
      if (existing) {
        return existing;
      }
      return tx.imageJob.create({
        data: {
          accountId: content.accountId,
          generatedContentId: content.id,
          status: "QUEUED",
          attempts: 0,
        },
      });
    });

    await enqueueImageJob({ jobId: job.id });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

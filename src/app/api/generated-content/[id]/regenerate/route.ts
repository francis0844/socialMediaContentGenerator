import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireVerifiedSession } from "@/lib/auth/session";
import {
  assertWithinMonthlyLimit,
  assertWithinTrialDailyLimit,
  hasGenerationAccess,
  isTrialActive,
} from "@/lib/billing/quota";
import { prisma } from "@/lib/db";
import { enqueueImageJob } from "@/lib/queue/imageQueue";

const bodySchema = z.object({
  mode: z.enum(["retry", "regenerate"]).default("regenerate"),
  imageIdea: z.string().optional().nullable(),
  aspectRatio: z.enum(["1:1", "4:5", "9:16"]).optional().nullable(),
});

export async function POST(req: NextRequest, context: any) {
  try {
    const session = await requireVerifiedSession();
    const id = context?.params?.id as string;
    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.parse(body);

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

    if (parsed.mode === "retry" && content.imageStatus !== "failed") {
      return NextResponse.json({ ok: false, error: "ONLY_FAILED_CAN_RETRY" }, { status: 400 });
    }

    const account = await prisma.account.findUniqueOrThrow({ where: { id: session.accountId } });
    if (
      !hasGenerationAccess({
        billingStatus: account.billingStatus,
        trialEndsAt: account.trialEndsAt,
      })
    ) {
      return NextResponse.json({ ok: false, error: "PAYMENT_REQUIRED" }, { status: 402 });
    }
    if (isTrialActive(account.trialEndsAt)) {
      await assertWithinTrialDailyLimit(account.id);
    } else {
      await assertWithinMonthlyLimit(account.id);
    }

    const job = await prisma.$transaction(async (tx) => {
      await tx.generatedContent.update({
        where: { id: content.id },
        data: {
          imageStatus: "generating",
          imageError: null,
          imagePrompt: null,
          imageModelId: null,
          // keep existing primaryImageAssetId for history
        },
      });

      const created = await tx.imageJob.create({
        data: {
          accountId: content.accountId,
          generatedContentId: content.id,
          status: "QUEUED",
          attempts: 0,
        },
      });

      // optionally persist overrides into request.direction for future prompt tweaks
      if (parsed.imageIdea || parsed.aspectRatio) {
        await tx.generationRequest.update({
          where: { id: content.requestId },
          data: {
            direction: {
              ...(content.request.direction as any),
              imageIdea: parsed.imageIdea ?? (content.request.direction as any)?.imageIdea ?? null,
              aspectRatio: parsed.aspectRatio ?? (content.request.direction as any)?.aspectRatio ?? "1:1",
            },
          },
        });
      }

      return created;
    });

    await enqueueImageJob({ jobId: job.id });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

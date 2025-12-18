import { NextResponse } from "next/server";
import { z } from "zod";

import { generateAIOutput, generationDirectionSchema } from "@/lib/ai/generate";
import { contentTypeSchema, socialPlatformSchema } from "@/lib/ai/schemas";
import { requireVerifiedSession } from "@/lib/auth/session";
import {
  assertWithinBillingCycleLimit,
  assertWithinTrialDailyLimit,
  hasGenerationAccess,
  isTrialActive,
} from "@/lib/billing/quota";
import { getBrandProfileCompleteness } from "@/lib/brand/profile";
import { prisma } from "@/lib/db";
import { maybeFetchVoiceDocText } from "@/lib/brand/voiceDoc";
import { getRatelimit } from "@/lib/ratelimit";

const requestSchema = z.object({
  contentType: contentTypeSchema,
  platform: socialPlatformSchema,
  direction: generationDirectionSchema,
});

export async function POST(req: Request) {
  try {
    const session = await requireVerifiedSession();
    const account = await prisma.account.findUniqueOrThrow({
      where: { id: session.accountId },
    });

    const rate = getRatelimit();
    if (rate) {
      const rl = await rate.limit(`gen:${session.user.id}`);
      if (!rl.success) {
        return NextResponse.json({ ok: false, error: "RATE_LIMITED" }, { status: 429 });
      }
    }

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
      await assertWithinBillingCycleLimit({
        accountId: account.id,
        periodStart: account.billingPeriodStart ?? null,
      });
    }

    const body = await req.json();
    const parsed = requestSchema.parse(body);

    const brand = await prisma.brandProfile.findUnique({
      where: { accountId: account.id },
    });
    if (!brand) {
      return NextResponse.json(
        { ok: false, error: "BRAND_PROFILE_REQUIRED" },
        { status: 400 },
      );
    }
    const completeness = getBrandProfileCompleteness(brand);
    if (!completeness.complete) {
      return NextResponse.json(
        { ok: false, error: "BRAND_PROFILE_INCOMPLETE", missing: completeness.missing },
        { status: 400 },
      );
    }

    const memory = await prisma.aiMemory.findUnique({
      where: { accountId: account.id },
    });

    const voiceDocText =
      brand.voiceMode === "uploaded" ? await maybeFetchVoiceDocText(brand.voiceDocUrl) : null;

    const output = await generateAIOutput({
      contentType: parsed.contentType,
      platform: parsed.platform,
      direction: parsed.direction,
      brand: {
        brandName: brand.brandName,
        about: brand.about,
        niche: brand.niche,
        targetAudience: brand.targetAudience,
        goals: brand.goals,
        colors: brand.colorsJson,
        voiceMode:
          brand.voiceMode === "preset"
            ? `preset:${brand.voicePreset ?? ""}`
            : "uploaded",
        voiceDocText,
      },
      memorySummary: memory?.memorySummary ?? "",
    });

    const { request, content } = await prisma.$transaction(async (tx) => {
      const request = await tx.generationRequest.create({
        data: {
          accountId: account.id,
          contentType: parsed.contentType,
          platform: parsed.platform,
          direction: parsed.direction,
        },
      });

      const caption =
        output.type === "text"
          ? output.caption
          : output.type === "graphic"
            ? output.caption
            : output.type === "story"
              ? output.caption
              : output.caption;

      const hashtags = output.hashtags ?? [];

      const content = await tx.generatedContent.create({
        data: {
          accountId: account.id,
          requestId: request.id,
          title:
            output.type === "graphic"
              ? (output.headline_options[0] ?? null)
              : output.type === "video"
                ? output.hook
                : null,
          output,
          caption,
          hashtags,
          status: "generated",
        },
      });

      return { request, content };
    });

    return NextResponse.json({
      ok: true,
      requestId: request.id,
      content: {
        id: content.id,
        status: content.status,
        createdAt: content.createdAt.toISOString(),
        title: content.title,
        output: content.output,
        caption: content.caption,
        hashtags: content.hashtags,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status =
      message === "UNAUTHENTICATED"
        ? 401
        : message === "TRIAL_DAILY_LIMIT_REACHED" || message === "BILLING_CYCLE_LIMIT_REACHED"
          ? 429
          : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

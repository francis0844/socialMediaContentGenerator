import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { requireVerifiedSession } from "@/lib/auth/session";
import { getBrandProfileCompleteness } from "@/lib/brand/profile";
import { prisma } from "@/lib/db";

const voiceModeSchema = z.enum(["preset", "uploaded"]);
const voicePresetSchema = z.enum([
  "professional",
  "friendly",
  "bold",
  "playful",
  "inspirational",
]);

const brandProfileSchema = z.object({
  brandName: z.string().min(1),
  logoUrl: z.string().url().optional().nullable(),
  companyOverview: z.string().min(1),
  niche: z.string().min(1),
  colors: z
    .array(z.object({ name: z.string().min(1), hex: z.string().min(3) }))
    .optional()
    .nullable(),
  targetAudience: z.string().min(1),
  goals: z.string().min(1),
  brandVoiceMode: voiceModeSchema,
  voicePreset: voicePresetSchema.optional().nullable(),
  voiceDocUrl: z.string().url().optional().nullable(),
});

export async function GET() {
  try {
    const session = await requireVerifiedSession();

    const profile = await prisma.brandProfile.findUnique({
      where: { accountId: session.accountId },
    });

    const completeness = getBrandProfileCompleteness(profile);

    return NextResponse.json({
      ok: true,
      profile: profile
        ? {
            brandName: profile.brandName,
            logoUrl: profile.logoUrl,
            companyOverview: profile.about,
            niche: profile.niche,
            colors: profile.colorsJson,
            targetAudience: profile.targetAudience,
            goals: profile.goals,
            brandVoiceMode: profile.voiceMode,
            voicePreset: profile.voicePreset,
            voiceDocUrl: profile.voiceDocUrl,
          }
        : null,
      completeness,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireVerifiedSession();

    const body = await req.json();
    const parsed = brandProfileSchema.parse(body);

    if (parsed.brandVoiceMode === "uploaded") {
      if (!parsed.voiceDocUrl) throw new Error("VOICE_DOC_REQUIRED");
    } else {
      if (!parsed.voicePreset) throw new Error("VOICE_PRESET_REQUIRED");
    }

    const colorsJson =
      parsed.colors === null ? Prisma.JsonNull : (parsed.colors ?? undefined);

    const profile = await prisma.brandProfile.upsert({
      where: { accountId: session.accountId },
      update: {
        brandName: parsed.brandName,
        logoUrl: parsed.logoUrl ?? null,
        about: parsed.companyOverview,
        niche: parsed.niche,
        colorsJson,
        targetAudience: parsed.targetAudience,
        goals: parsed.goals,
        voiceMode: parsed.brandVoiceMode,
        voicePreset: parsed.brandVoiceMode === "preset" ? parsed.voicePreset ?? null : null,
        voiceDocUrl: parsed.voiceDocUrl ?? null,
      },
      create: {
        accountId: session.accountId,
        brandName: parsed.brandName,
        logoUrl: parsed.logoUrl ?? null,
        about: parsed.companyOverview,
        niche: parsed.niche,
        colorsJson: colorsJson ?? Prisma.JsonNull,
        targetAudience: parsed.targetAudience,
        goals: parsed.goals,
        voiceMode: parsed.brandVoiceMode,
        voicePreset: parsed.brandVoiceMode === "preset" ? parsed.voicePreset ?? null : null,
        voiceDocUrl: parsed.voiceDocUrl ?? null,
      },
    });

    const completeness = getBrandProfileCompleteness(profile);

    return NextResponse.json({
      ok: true,
      profile: {
        brandName: profile.brandName,
        logoUrl: profile.logoUrl,
        companyOverview: profile.about,
        niche: profile.niche,
        colors: profile.colorsJson,
        targetAudience: profile.targetAudience,
        goals: profile.goals,
        brandVoiceMode: profile.voiceMode,
        voicePreset: profile.voicePreset,
        voiceDocUrl: profile.voiceDocUrl,
      },
      completeness,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { requireVerifiedSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const brandProfileSchema = z.object({
  brandName: z.string().min(1),
  logoUrl: z.string().url().optional().nullable(),
  about: z.string().min(1),
  niche: z.string().min(1),
  colors: z
    .array(z.object({ name: z.string().min(1), hex: z.string().min(3) }))
    .optional()
    .nullable(),
  targetAudience: z.string().optional().nullable(),
  goals: z.string().optional().nullable(),
  voiceMode: z.string().optional().nullable(),
  voiceDocUrl: z.string().url().optional().nullable(),
});

export async function GET() {
  try {
    const session = await requireVerifiedSession();

    const profile = await prisma.brandProfile.findUnique({
      where: { accountId: session.accountId },
    });

    return NextResponse.json({
      ok: true,
      profile: profile
        ? {
            brandName: profile.brandName,
            logoUrl: profile.logoUrl,
            about: profile.about,
            niche: profile.niche,
            colors: profile.colorsJson,
            targetAudience: profile.targetAudience,
            goals: profile.goals,
            voiceMode: profile.voiceMode,
            voiceDocUrl: profile.voiceDocUrl,
          }
        : null,
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

    const colorsJson =
      parsed.colors === null ? Prisma.JsonNull : (parsed.colors ?? undefined);

    const profile = await prisma.brandProfile.upsert({
      where: { accountId: session.accountId },
      update: {
        brandName: parsed.brandName,
        logoUrl: parsed.logoUrl ?? null,
        about: parsed.about,
        niche: parsed.niche,
        colorsJson,
        targetAudience: parsed.targetAudience ?? null,
        goals: parsed.goals ?? null,
        voiceMode: parsed.voiceMode ?? null,
        voiceDocUrl: parsed.voiceDocUrl ?? null,
      },
      create: {
        accountId: session.accountId,
        brandName: parsed.brandName,
        logoUrl: parsed.logoUrl ?? null,
        about: parsed.about,
        niche: parsed.niche,
        colorsJson: colorsJson ?? Prisma.JsonNull,
        targetAudience: parsed.targetAudience ?? null,
        goals: parsed.goals ?? null,
        voiceMode: parsed.voiceMode ?? null,
        voiceDocUrl: parsed.voiceDocUrl ?? null,
      },
    });

    return NextResponse.json({
      ok: true,
      profile: {
        brandName: profile.brandName,
        logoUrl: profile.logoUrl,
        about: profile.about,
        niche: profile.niche,
        colors: profile.colorsJson,
        targetAudience: profile.targetAudience,
        goals: profile.goals,
        voiceMode: profile.voiceMode,
        voiceDocUrl: profile.voiceDocUrl,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

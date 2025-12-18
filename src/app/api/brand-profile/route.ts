import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { requireAuthedUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrCreateTenantForUser } from "@/lib/tenant";

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
    const authed = await requireAuthedUser();
    const { account } = await getOrCreateTenantForUser(authed);

    const profile = await prisma.brandProfile.findUnique({
      where: { accountId: account.id },
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
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    const authed = await requireAuthedUser();
    const { account } = await getOrCreateTenantForUser(authed);

    const body = await req.json();
    const parsed = brandProfileSchema.parse(body);

    const colorsJson =
      parsed.colors === null ? Prisma.JsonNull : (parsed.colors ?? undefined);

    const profile = await prisma.brandProfile.upsert({
      where: { accountId: account.id },
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
        accountId: account.id,
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

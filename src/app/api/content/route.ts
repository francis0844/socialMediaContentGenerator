import { NextResponse } from "next/server";
import { z } from "zod";

import { contentTypeSchema, socialPlatformSchema } from "@/lib/ai/schemas";
import { requireAuthedUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrCreateTenantForUser } from "@/lib/tenant";

const statusSchema = z.enum(["generated", "accepted", "rejected"]);

export async function GET(req: Request) {
  try {
    const authed = await requireAuthedUser();
    const { account } = await getOrCreateTenantForUser(authed);

    const url = new URL(req.url);
    const status = statusSchema.parse(url.searchParams.get("status") ?? "generated");
    const platformParam = url.searchParams.get("platform");
    const typeParam = url.searchParams.get("type");

    const platform = platformParam ? socialPlatformSchema.parse(platformParam) : null;
    const contentType = typeParam ? contentTypeSchema.parse(typeParam) : null;

    const items = await prisma.generatedContent.findMany({
      where: {
        accountId: account.id,
        status,
        ...(platform || contentType
          ? {
              request: {
                ...(platform ? { platform } : {}),
                ...(contentType ? { contentType } : {}),
              },
            }
          : {}),
      },
      include: { request: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      ok: true,
      items: items.map((i) => ({
        id: i.id,
        status: i.status,
        createdAt: i.createdAt.toISOString(),
        title: i.title,
        platform: i.request.platform,
        contentType: i.request.contentType,
        output: i.output,
        caption: i.caption,
        hashtags: i.hashtags,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status =
      message === "UNAUTHENTICATED" ? 401 : message.includes("Invalid") ? 400 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}


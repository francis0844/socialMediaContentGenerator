import { NextResponse } from "next/server";
import { z } from "zod";

import { contentTypeSchema, socialPlatformSchema } from "@/lib/ai/schemas";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const statusSchema = z.enum(["generated", "accepted", "rejected"]);
const dateSchema = z.string().datetime().optional();

export async function GET(req: Request) {
  try {
    const session = await requireSession();

    const url = new URL(req.url);
    const status = statusSchema.parse(url.searchParams.get("status") ?? "generated");
    const platformParam = url.searchParams.get("platform");
    const typeParam = url.searchParams.get("type");
    const fromParam = url.searchParams.get("from") ?? undefined;
    const toParam = url.searchParams.get("to") ?? undefined;
    const q = url.searchParams.get("q") ?? undefined;
    const takeParam = url.searchParams.get("take");
    const take = takeParam ? Math.max(1, Math.min(50, parseInt(takeParam, 10))) : 50;

    const platform = platformParam ? socialPlatformSchema.parse(platformParam) : null;
    const contentType = typeParam ? contentTypeSchema.parse(typeParam) : null;
    const from = fromParam ? dateSchema.parse(fromParam) : undefined;
    const to = toParam ? dateSchema.parse(toParam) : undefined;

    const items = await prisma.generatedContent.findMany({
      where: {
        accountId: session.accountId,
        status,
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
        ...(platform || contentType
          ? {
              request: {
                ...(platform ? { platform } : {}),
                ...(contentType ? { contentType } : {}),
              },
            }
          : {}),
        ...(q
          ? {
              OR: [
                { caption: { contains: q, mode: "insensitive" } },
                { title: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { request: true },
      orderBy: { createdAt: "desc" },
      take,
    });

    return NextResponse.json({
      ok: true,
      items: items.map((i) => ({
        id: i.id,
        status: i.status,
        imageStatus: i.imageStatus,
        imageUrl: i.imageUrl,
        imageAspectRatio: i.imageAspectRatio,
        imageModel: i.imageModel,
        createdAt: i.createdAt.toISOString(),
        title: i.title,
        platform: i.request.platform,
        contentType: i.request.contentType,
        output: i.output,
        caption: i.caption,
        hashtags: i.hashtags,
        imageError: i.imageError,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

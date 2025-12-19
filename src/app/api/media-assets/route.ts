import { NextResponse } from "next/server";
import { z } from "zod";

import { requireVerifiedSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional().nullable(),
  mimeType: z.string().min(1),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  type: z.enum(["LOGO", "PRODUCT_MOCKUP", "STYLE_MIMIC", "GENERATED_IMAGE"]),
  storageProvider: z.enum(["CLOUDINARY", "S3"]).default("CLOUDINARY"),
});

export async function POST(req: Request) {
  try {
    const session = await requireVerifiedSession();
    const body = await req.json();
    const parsed = bodySchema.parse(body);

    const asset = await prisma.mediaAsset.create({
      data: {
        accountId: session.accountId,
        type: parsed.type,
        storageProvider: parsed.storageProvider,
        url: parsed.url,
        thumbnailUrl: parsed.thumbnailUrl ?? null,
        mimeType: parsed.mimeType,
        width: parsed.width ?? null,
        height: parsed.height ?? null,
      },
    });

    return NextResponse.json({ ok: true, assetId: asset.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "MEDIA_ASSET_CREATE_FAILED";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

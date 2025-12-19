import { NextResponse } from "next/server";
import { z } from "zod";

import { requireVerifiedSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  mediaAssetId: z.string().min(1),
  kind: z.enum(["PRODUCT_MOCKUP", "STYLE_MIMIC", "LOGO_OVERRIDE"]),
  label: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const session = await requireVerifiedSession();
    const body = await req.json();
    const parsed = bodySchema.parse(body);

    const asset = await prisma.mediaAsset.findUnique({
      where: { id: parsed.mediaAssetId },
      select: { accountId: true },
    });
    if (!asset || asset.accountId !== session.accountId) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const ref = await prisma.uploadedImageReference.create({
      data: {
        accountId: session.accountId,
        mediaAssetId: parsed.mediaAssetId,
        kind: parsed.kind,
        label: parsed.label,
      },
    });

    return NextResponse.json({ ok: true, referenceId: ref.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "REFERENCE_CREATE_FAILED";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

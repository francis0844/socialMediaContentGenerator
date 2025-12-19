import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

type RouteParams = { params: { id: string } };

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const id = params.id;

    const content = await prisma.generatedContent.findFirst({
      where: { id, accountId: session.accountId },
      select: { id: true, requestId: true, primaryImageAssetId: true },
    });

    if (!content) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.generatedContent.delete({ where: { id: content.id } });

      const requestCount = await tx.generatedContent.count({
        where: { requestId: content.requestId },
      });
      if (requestCount === 0) {
        await tx.generationRequest.delete({ where: { id: content.requestId } });
      }

      if (content.primaryImageAssetId) {
        const usageCount = await tx.generatedContent.count({
          where: { primaryImageAssetId: content.primaryImageAssetId },
        });
        if (usageCount === 0) {
          const asset = await tx.mediaAsset.findUnique({
            where: { id: content.primaryImageAssetId },
            select: { id: true, type: true },
          });
          if (asset?.type === "GENERATED_IMAGE") {
            await tx.mediaAsset.delete({ where: { id: asset.id } });
          }
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

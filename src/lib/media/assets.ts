import "server-only";

import { prisma } from "@/lib/db";

export async function listMediaAssets(accountId: string, types?: string[]) {
  return prisma.mediaAsset.findMany({
    where: {
      accountId,
      ...(types?.length ? { type: { in: types as any } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listUploadedImageReferences(accountId: string, kinds?: string[]) {
  return prisma.uploadedImageReference.findMany({
    where: {
      accountId,
      ...(kinds?.length ? { kind: { in: kinds as any } } : {}),
    },
    include: { mediaAsset: true },
    orderBy: { createdAt: "desc" },
  });
}

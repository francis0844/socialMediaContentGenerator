import { NextResponse } from "next/server";

import { requireVerifiedSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getCloudinary } from "@/lib/cloudinary";
import { validateImageFile } from "@/lib/uploads/validators";

export const runtime = "nodejs";

const kindToAssetType = {
  PRODUCT_MOCKUP: "PRODUCT_MOCKUP",
  STYLE_MIMIC: "STYLE_MIMIC",
  LOGO_OVERRIDE: "LOGO",
} as const;

export async function POST(req: Request) {
  try {
    const session = await requireVerifiedSession();
    const form = await req.formData();
    const kind = form.get("kind");
    const file = form.get("file");

    if (typeof kind !== "string" || !["PRODUCT_MOCKUP", "STYLE_MIMIC", "LOGO_OVERRIDE"].includes(kind)) {
      return NextResponse.json({ ok: false, error: "INVALID_KIND" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "FILE_REQUIRED" }, { status: 400 });
    }

    validateImageFile(file);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const cloudinary = getCloudinary();
    const upload = await new Promise<{
      secure_url: string;
      width?: number;
      height?: number;
      format?: string;
      resource_type?: string;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "smm/refs",
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error("UPLOAD_FAILED"));
            resolve({
              secure_url: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
              resource_type: result.resource_type,
            });
          },
        )
        .end(buffer);
    });

    const asset = await prisma.mediaAsset.create({
      data: {
        accountId: session.accountId,
        type: kindToAssetType[kind as keyof typeof kindToAssetType] as any,
        storageProvider: "CLOUDINARY",
        url: upload.secure_url,
        thumbnailUrl: null,
        mimeType: file.type || "image/png",
        width: upload.width ?? null,
        height: upload.height ?? null,
      },
    });

    return NextResponse.json({
      ok: true,
      mediaAssetId: asset.id,
      url: asset.url,
      thumbnailUrl: asset.thumbnailUrl,
      mimeType: asset.mimeType,
      width: asset.width,
      height: asset.height,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UPLOAD_FAILED";
    const status =
      message === "UNSUPPORTED_MIME_TYPE" || message === "FILE_TOO_LARGE" ? 400 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

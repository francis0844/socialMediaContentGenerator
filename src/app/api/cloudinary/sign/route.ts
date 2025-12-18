import { NextResponse } from "next/server";
import { z } from "zod";

import { requireVerifiedSession } from "@/lib/auth/session";
import { getCloudinary } from "@/lib/cloudinary";

const bodySchema = z.object({
  folder: z.string().min(1).default("smm"),
  resourceType: z.enum(["image", "raw", "video", "auto"]).default("auto"),
  allowedFormats: z.array(z.string().min(1)).optional(),
});

export async function POST(req: Request) {
  try {
    await requireVerifiedSession();

    const body = bodySchema.parse(await req.json().catch(() => ({})));
    const cloudinary = getCloudinary();

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = {
      folder: body.folder,
      timestamp,
      resource_type: body.resourceType,
      ...(body.allowedFormats?.length ? { allowed_formats: body.allowedFormats.join(",") } : {}),
    };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      cloudinary.config().api_secret!,
    );

    return NextResponse.json({
      ok: true,
      timestamp,
      signature,
      folder: body.folder,
      apiKey: cloudinary.config().api_key,
      cloudName: cloudinary.config().cloud_name,
      resourceType: body.resourceType,
      allowedFormats: body.allowedFormats ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

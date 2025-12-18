import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuthedUser } from "@/lib/auth";
import { getCloudinary } from "@/lib/cloudinary";
import { getOrCreateTenantForUser } from "@/lib/tenant";

const bodySchema = z.object({
  folder: z.string().min(1).default("smm"),
});

export async function POST(req: Request) {
  try {
    const authed = await requireAuthedUser();
    await getOrCreateTenantForUser(authed);

    const body = bodySchema.parse(await req.json().catch(() => ({})));
    const cloudinary = getCloudinary();

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = {
      folder: body.folder,
      timestamp,
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
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}


import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyEmailWithToken } from "@/lib/security/emailVerification";

const bodySchema = z.object({ token: z.string().min(10) });

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const result = await verifyEmailWithToken(body.token);
    return NextResponse.json({ ok: true, email: result.email });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}


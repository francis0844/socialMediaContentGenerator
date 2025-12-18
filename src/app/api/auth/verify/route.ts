import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyEmailWithToken } from "@/lib/security/emailVerification";
import { getClientIpFromHeaders, getRatelimit } from "@/lib/ratelimit";

const bodySchema = z.object({ token: z.string().min(10) });

export async function POST(req: Request) {
  try {
    const rate = getRatelimit();
    if (rate) {
      const ip = getClientIpFromHeaders(req.headers as unknown as Headers);
      const rl = await rate.limit(`auth:verify:${ip}`);
      if (!rl.success) {
        return NextResponse.json({ ok: false, error: "RATE_LIMITED" }, { status: 429 });
      }
    }

    const body = bodySchema.parse(await req.json());
    const result = await verifyEmailWithToken(body.token);
    return NextResponse.json({ ok: true, email: result.email });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

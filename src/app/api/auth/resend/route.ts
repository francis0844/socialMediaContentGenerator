import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getClientIpFromHeaders, getRatelimit } from "@/lib/ratelimit";
import { createEmailVerificationToken } from "@/lib/security/emailVerification";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const rate = getRatelimit();
    if (rate) {
      const ip = getClientIpFromHeaders(req.headers as unknown as Headers);
      const rl = await rate.limit(`auth:resend:${ip}`);
      if (!rl.success) {
        return NextResponse.json({ ok: false, error: "RATE_LIMITED" }, { status: 429 });
      }
    }

    const body = bodySchema.parse(await req.json());
    const email = body.email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ ok: false, error: "ALREADY_VERIFIED" }, { status: 400 });
    }

    const { token } = await createEmailVerificationToken(user.id);

    const baseUrl =
      process.env.NEXTAUTH_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    const verifyUrl = `${baseUrl}/verify?token=${token}`;
    console.log(`[verify-email-resend] ${email}: ${verifyUrl}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}


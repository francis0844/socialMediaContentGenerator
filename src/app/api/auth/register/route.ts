import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getRatelimit, getClientIpFromHeaders } from "@/lib/ratelimit";
import { hashPassword } from "@/lib/security/password";
import { createEmailVerificationToken } from "@/lib/security/emailVerification";
import { ensureAccountForUser } from "@/lib/tenancy/ensureAccountForUser";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const rate = getRatelimit();
    if (rate) {
      const ip = getClientIpFromHeaders(req.headers as unknown as Headers);
      const rl = await rate.limit(`auth:register:${ip}`);
      if (!rl.success) {
        return NextResponse.json({ ok: false, error: "RATE_LIMITED" }, { status: 429 });
      }
    }

    const body = bodySchema.parse(await req.json());
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "EMAIL_IN_USE" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: { email, passwordHash, emailVerified: null },
    });
    await ensureAccountForUser(user.id);

    const { token } = await createEmailVerificationToken(user.id);

    const baseUrl =
      process.env.NEXTAUTH_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    const verifyUrl = `${baseUrl}/verify?token=${token}`;
    console.log(`[verify-email] ${email}: ${verifyUrl}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

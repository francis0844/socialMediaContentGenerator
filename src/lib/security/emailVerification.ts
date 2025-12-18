import "server-only";

import crypto from "crypto";

import { prisma } from "@/lib/db";

export async function createEmailVerificationToken(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.emailVerificationToken.create({
    data: { userId, token, expiresAt },
  });

  return { token, expiresAt };
}

export async function verifyEmailWithToken(token: string) {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!record) throw new Error("INVALID_TOKEN");
  if (record.expiresAt.getTime() < Date.now()) throw new Error("TOKEN_EXPIRED");

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    });
    await tx.emailVerificationToken.delete({ where: { token } });
  });

  return { userId: record.userId, email: record.user.email };
}


import "server-only";

import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth/options";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.accountId) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

export async function requireVerifiedSession() {
  const session = await requireSession();
  if (!session.user.emailVerified) {
    throw new Error("EMAIL_NOT_VERIFIED");
  }
  return session;
}

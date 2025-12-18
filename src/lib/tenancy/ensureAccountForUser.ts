import "server-only";

import { prisma } from "@/lib/db";

export async function ensureAccountForUser(userId: string) {
  const existing = await prisma.membership.findFirst({
    where: { userId },
    select: { accountId: true },
  });
  if (existing) return existing.accountId;

  const account = await prisma.account.create({
    data: {
      name: "My Business",
      memberships: { create: { userId, role: "OWNER" } },
      aiMemory: { create: { memorySummary: "" } },
    },
  });

  return account.id;
}


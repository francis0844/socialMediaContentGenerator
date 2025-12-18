import "server-only";

import { prisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env/server";

const TRIAL_DAYS = 3;

export function isAdminEmail(email: string) {
  const allowlist = getServerEnv().ADMIN_EMAIL_ALLOWLIST ?? "";
  const emails = allowlist
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return emails.includes(email.toLowerCase());
}

export async function getOrCreateTenantForUser(params: {
  firebaseUid: string;
  email: string;
}) {
  const user = await prisma.user.upsert({
    where: { firebaseUid: params.firebaseUid },
    update: { email: params.email },
    create: { firebaseUid: params.firebaseUid, email: params.email },
  });

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { account: true },
    orderBy: { createdAt: "asc" },
  });

  if (membership) return { user, membership, account: membership.account };

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const account = await prisma.account.create({
    data: {
      name: "My Business",
      billingStatus: "trialing",
      trialEndsAt,
      memberships: {
        create: {
          userId: user.id,
          role: isAdminEmail(user.email) ? "admin" : "owner",
        },
      },
      aiMemory: { create: { memorySummary: "" } },
    },
  });

  const createdMembership = await prisma.membership.findUniqueOrThrow({
    where: { userId_accountId: { userId: user.id, accountId: account.id } },
  });

  return { user, membership: createdMembership, account };
}

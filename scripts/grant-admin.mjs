import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const emailArg = process.argv[2];
  if (!emailArg) {
    console.error("Usage: node scripts/grant-admin.mjs <email>");
    process.exit(1);
  }

  const email = emailArg.toLowerCase().trim();

  const user = await prisma.user.upsert({
    where: { email },
    update: { emailVerified: new Date() },
    create: { email, emailVerified: new Date() },
  });

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    select: { accountId: true },
    orderBy: { createdAt: "asc" },
  });

  let accountId = membership?.accountId ?? null;

  if (!accountId) {
    const account = await prisma.account.create({
      data: {
        name: "My Business",
        plan: "full_access",
        billingStatus: "active",
        trialEndsAt: null,
        memberships: { create: { userId: user.id, role: "OWNER" } },
        aiMemory: { create: { memorySummary: "" } },
      },
    });
    accountId = account.id;
  } else {
    await prisma.membership.updateMany({
      where: { userId: user.id, accountId },
      data: { role: "OWNER" },
    });
  }

  await prisma.account.update({
    where: { id: accountId },
    data: { plan: "full_access", billingStatus: "active", trialEndsAt: null },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        email,
        userId: user.id,
        accountId,
        note: "To enable admin UI + endpoints, set ADMIN_EMAIL_ALLOWLIST to include this email.",
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

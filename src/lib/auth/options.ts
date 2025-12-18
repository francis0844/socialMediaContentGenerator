import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env/server";
import { verifyPassword } from "@/lib/security/password";
import { ensureAccountForUser } from "@/lib/tenancy/ensureAccountForUser";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const env = getServerEnv();

export const authOptions: NextAuthOptions = {
  secret:
    env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "development" ? "dev-secret" : undefined),
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        if (!user?.passwordHash) return null;
        const ok = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        await ensureAccountForUser(user.id);
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user?.email) return false;

      const email = user.email.toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email } });

      if (account?.provider === "google") {
        const emailVerified =
          (profile as { email_verified?: boolean } | null)?.email_verified === true
            ? new Date()
            : undefined;

        const upserted = await prisma.user.upsert({
          where: { email },
          update: {
            name: user.name ?? undefined,
            image: user.image ?? undefined,
            ...(emailVerified ? { emailVerified } : {}),
          },
          create: {
            email,
            name: user.name ?? null,
            image: user.image ?? null,
            emailVerified: emailVerified ?? new Date(),
          },
        });

        if (account.providerAccountId) {
          await prisma.oAuthAccount.upsert({
            where: {
              provider_providerAccountId: {
                provider: "google",
                providerAccountId: account.providerAccountId,
              },
            },
            update: { userId: upserted.id },
            create: {
              userId: upserted.id,
              provider: "google",
              providerAccountId: account.providerAccountId,
            },
          });
        }

        await ensureAccountForUser(upserted.id);
        (user as typeof user & { id: string }).id = upserted.id;
        return true;
      }

      if (existing) {
        await ensureAccountForUser(existing.id);
        (user as typeof user & { id: string }).id = existing.id;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.userId = user.id;

      if (token.userId) {
        const [membership, dbUser] = await Promise.all([
          prisma.membership.findFirst({
            where: { userId: token.userId },
            select: { accountId: true },
            orderBy: { createdAt: "asc" },
          }),
          prisma.user.findUnique({
            where: { id: token.userId },
            select: { emailVerified: true },
          }),
        ]);

        if (membership) token.accountId = membership.accountId;
        token.emailVerified = Boolean(dbUser?.emailVerified);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.emailVerified = (token.emailVerified as boolean) ?? false;
      }
      session.accountId = token.accountId as string;
      return session;
    },
  },
};


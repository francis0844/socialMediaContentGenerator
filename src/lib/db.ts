import "server-only";

import { PrismaClient } from "@prisma/client";

// Help avoid session-mode pool exhaustion on Supabase/pgbouncer by forcing connection_limit defaults
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("connection_limit")) {
  const hasQuery = process.env.DATABASE_URL.includes("?");
  process.env.DATABASE_URL = `${process.env.DATABASE_URL}${hasQuery ? "&" : "?"}pgbouncer=true&connection_limit=1`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

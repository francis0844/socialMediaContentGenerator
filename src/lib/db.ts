import "server-only";

import { PrismaClient } from "@prisma/client";

// Normalize to DATABASE_URL (pooler) and append safe defaults if missing.
if (process.env.DATABASE_URL) {
  const hasQuery = process.env.DATABASE_URL.includes("?");
  if (!process.env.DATABASE_URL.includes("connection_limit")) {
    process.env.DATABASE_URL = `${process.env.DATABASE_URL}${hasQuery ? "&" : "?"}pgbouncer=true&connection_limit=1`;
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

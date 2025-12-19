import "server-only";

import { PrismaClient } from "@prisma/client";

// Use pooler URL for runtime connections; append safe defaults if not present.
const poolUrlEnv = "DATABASE_POOL_URL";
if (process.env[poolUrlEnv] && !process.env[poolUrlEnv]!.includes("connection_limit")) {
  const hasQuery = process.env[poolUrlEnv]!.includes("?");
  process.env[poolUrlEnv] = `${process.env[poolUrlEnv]}${hasQuery ? "&" : "?"}pgbouncer=true&connection_limit=1`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

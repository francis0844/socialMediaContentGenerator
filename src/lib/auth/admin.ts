import "server-only";

import { getServerEnv } from "@/lib/env/server";

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const allowlist = getServerEnv().ADMIN_EMAIL_ALLOWLIST ?? "";
  const emails = allowlist
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return emails.includes(email.toLowerCase());
}


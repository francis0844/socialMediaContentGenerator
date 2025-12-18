import "server-only";

import { headers } from "next/headers";

import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export type AuthedUser = {
  firebaseUid: string;
  email: string;
};

export async function requireAuthedUser(): Promise<AuthedUser> {
  const h = await headers();
  const authHeader = h.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer (.+)$/i);
  const idToken = match?.[1];

  if (!idToken) {
    throw new Error("UNAUTHENTICATED");
  }

  const decoded = await getFirebaseAdminAuth().verifyIdToken(idToken);
  const email = decoded.email;
  if (!email) {
    throw new Error("EMAIL_REQUIRED");
  }

  return { firebaseUid: decoded.uid, email };
}

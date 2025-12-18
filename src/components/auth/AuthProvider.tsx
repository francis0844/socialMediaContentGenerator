"use client";

import { User as FirebaseUser, onIdTokenChanged, signOut } from "firebase/auth";
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { getFirebaseAuth } from "@/lib/firebase/client";

type Account = {
  id: string;
  name: string;
  plan: string;
  billingStatus: string;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
};

type AuthState = {
  loading: boolean;
  user: FirebaseUser | null;
  idToken: string | null;
  account: Account | null;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);

async function bootstrap(idToken: string): Promise<{
  account: Account;
  isAdmin: boolean;
}> {
  const res = await fetch("/api/bootstrap", {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: "no-store",
  });
  const data: unknown = await res.json();
  const parsed = data as {
    ok?: boolean;
    error?: string;
    account?: Account;
    user?: { isAdmin?: boolean };
  };
  if (!res.ok || !parsed?.ok || !parsed.account) {
    throw new Error(parsed?.error ?? "BOOTSTRAP_FAILED");
  }
  return {
    account: parsed.account,
    isAdmin: Boolean(parsed.user?.isAdmin),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getFirebaseAuth().currentUser?.getIdToken(true);
    if (!token) return;
    const boot = await bootstrap(token);
    setAccount(boot.account);
    setIsAdmin(boot.isAdmin);
  }, []);

  const logout = useCallback(async () => {
    await signOut(getFirebaseAuth());
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(getFirebaseAuth(), async (nextUser) => {
      setLoading(true);
      setUser(nextUser);
      const token = nextUser ? await nextUser.getIdToken() : null;
      setIdToken(token);

      if (token) {
        try {
          const boot = await bootstrap(token);
          setAccount(boot.account);
          setIsAdmin(boot.isAdmin);
        } catch {
          setAccount(null);
          setIsAdmin(false);
        }
      } else {
        setAccount(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({ loading, user, idToken, account, isAdmin, refresh, logout }),
    [loading, user, idToken, account, isAdmin, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

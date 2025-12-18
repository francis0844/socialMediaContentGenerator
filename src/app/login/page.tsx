"use client";

import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/auth/useAuth";
import { getFirebaseAuth } from "@/lib/firebase/client";

export default function LoginPage() {
  const router = useRouter();
  const { loading, user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) {
    router.replace("/app");
  }

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      } else {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      }
      router.replace("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="text-sm tracking-[0.3em] uppercase text-white/70">
          Lexus
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-white/70">
          {mode === "signup"
            ? "Start your 3-day trial. No payment required."
            : "Sign in to continue to the studio."}
        </p>

        <div className="mt-8 space-y-4">
          <label className="block text-sm">
            <div className="mb-2 text-white/70">Email</div>
            <input
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@company.com"
            />
          </label>

          <label className="block text-sm">
            <div className="mb-2 text-white/70">Password</div>
            <input
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="••••••••"
              type="password"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            onClick={submit}
            disabled={submitting || !email || !password}
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-50"
          >
            {submitting
              ? "Please wait…"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </button>

          <div className="text-center text-sm text-white/70">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="text-white underline underline-offset-4"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New here?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-white underline underline-offset-4"
                >
                  Create account
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


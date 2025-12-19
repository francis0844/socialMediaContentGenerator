"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useSession();
  const next = params.get("next") ?? "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  async function signInWithCredentials() {
    setError(null);
    setResendStatus("idle");
    setResendMessage(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: next,
      });

      if (res?.error) {
        setError(res.error);
        return;
      }

      router.replace(next);
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    if (!email) return;
    setResendStatus("sending");
    setResendMessage(null);
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "RESEND_FAILED");
      setResendStatus("sent");
      setResendMessage("Verification link generated. Check server logs (dev) or your inbox.");
    } catch (e) {
      setResendStatus("error");
      setResendMessage(e instanceof Error ? e.message : "Resend failed");
    }
  }

  if (status === "authenticated") {
    router.replace(next);
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">
        Redirecting to your dashboard…
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6 py-12">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-teal-100 blur-3xl" />
        <div className="absolute right-10 top-32 h-80 w-80 rounded-full bg-indigo-100 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-50 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-2xl backdrop-blur-md md:grid-cols-[1.15fr_1fr]">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-white via-teal-50 to-white px-10 py-12 md:flex">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-600">Lexus Studio</div>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900">Welcome back</h2>
            <p className="mt-3 max-w-md text-sm text-slate-600">
              Pick up where you left off—generate on-brand social posts with your saved profile, AI memory, and
              subscription protected per account.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">Platforms</div>
              <div className="mt-1 font-semibold">FB · IG · Pinterest · X</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">Security</div>
              <div className="mt-1 font-semibold">Email verify + Google</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">Quota</div>
              <div className="mt-1 font-semibold">1,000/mo · 3-day trial</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">Feedback loop</div>
              <div className="mt-1 font-semibold">Accept/Reject learns</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-6 py-10 md:px-10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm tracking-[0.3em] uppercase text-muted-foreground">Lexus</div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Sign in</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Use email/password or Google. Email/password requires verification.
              </p>
            </div>
            <a
              href="/"
              className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 md:inline-flex"
            >
              Back to home
            </a>
          </div>

          <Button
            variant="secondary"
            className="w-full justify-center border-slate-200 text-slate-800 hover:border-teal-200 hover:bg-teal-50"
            onClick={() => signIn("google", { callbackUrl: next })}
          >
            Continue with Google
          </Button>

          <div className="relative py-1 text-center text-xs text-muted-foreground">
            <span className="bg-white px-2">or</span>
            <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                type="email"
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                type="password"
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error === "EMAIL_NOT_VERIFIED" ? "Please verify your email before signing in." : error}
                {error === "EMAIL_NOT_VERIFIED" ? (
                  <div className="text-xs text-destructive">
                    Use the verification link sent to your email (logged in server console during dev), then paste the
                    token on the{" "}
                    <a className="underline" href={`/verify?email=${encodeURIComponent(email)}`}>
                      verify page
                    </a>
                    .
                  </div>
                ) : null}
                {error === "EMAIL_NOT_VERIFIED" ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resendVerification}
                      disabled={resendStatus === "sending"}
                    >
                      {resendStatus === "sending" ? "Sending…" : "Resend verification"}
                    </Button>
                    {resendMessage ? <span className="text-destructive">{resendMessage}</span> : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <Button
              className="w-full"
              onClick={signInWithCredentials}
              disabled={!email || !password || loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <div>
              New here?{" "}
              <a className="font-semibold text-slate-800 underline underline-offset-4" href="/signup">
                Create an account
              </a>
            </div>
            <a className="text-sm font-semibold text-teal-700 underline underline-offset-4" href="/verify">
              Verify token
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

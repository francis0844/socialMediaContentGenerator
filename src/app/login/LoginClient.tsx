"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithCredentials() {
    setError(null);
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

  return (
    <div className="mx-auto flex min-h-dvh max-w-md items-center px-6 py-16">
      <div className="w-full space-y-6">
        <div>
          <div className="text-sm tracking-[0.3em] uppercase text-muted-foreground">
            Lexus
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use email/password or Google. Email/password requires verification.
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => signIn("google", { callbackUrl: next })}
        >
          Continue with Google
        </Button>

        <div className="relative py-2 text-center text-xs text-muted-foreground">
          <span className="bg-background px-2">or</span>
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
            <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error === "EMAIL_NOT_VERIFIED"
                ? "Please verify your email before signing in."
                : error}
              {error === "EMAIL_NOT_VERIFIED" ? (
                <div className="text-xs text-destructive">
                  Use the verification link sent to your email (logged in server console during dev),
                  then paste the token on the{" "}
                  <a className="underline" href={`/verify?email=${encodeURIComponent(email)}`}>
                    verify page
                  </a>
                  .
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

        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <a className="text-foreground underline underline-offset-4" href="/signup">
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}

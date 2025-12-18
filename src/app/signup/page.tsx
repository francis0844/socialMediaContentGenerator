"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const raw: unknown = await res.json();
      const data = raw as { ok?: boolean; error?: string };
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "SIGNUP_FAILED");
      router.replace(`/verify?email=${encodeURIComponent(email)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign up failed");
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
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We’ll require email verification before you can access the studio.
          </p>
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
              autoComplete="new-password"
              type="password"
              placeholder="At least 8 characters"
            />
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <Button
            onClick={submit}
            disabled={!email || password.length < 8 || loading}
            className="w-full"
          >
            {loading ? "Creating…" : "Create account"}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <a className="text-foreground underline underline-offset-4" href="/login">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

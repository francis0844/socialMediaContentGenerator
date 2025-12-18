"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VerifyPage() {
  const params = useSearchParams();
  const email = params.get("email");
  const tokenFromUrl = params.get("token");

  const [token, setToken] = useState(tokenFromUrl ?? "");
  const [status, setStatus] = useState<
    "idle" | "verifying" | "verified" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenFromUrl) return;
    (async () => {
      setStatus("verifying");
      setError(null);
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenFromUrl }),
        });
        const raw: unknown = await res.json();
        const data = raw as { ok?: boolean; error?: string };
        if (!res.ok || !data?.ok) throw new Error(data?.error ?? "VERIFY_FAILED");
        setStatus("verified");
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Verification failed");
      }
    })();
  }, [tokenFromUrl]);

  async function verifyManual() {
    setStatus("verifying");
    setError(null);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const raw: unknown = await res.json();
      const data = raw as { ok?: boolean; error?: string };
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "VERIFY_FAILED");
      setStatus("verified");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Verification failed");
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
            Verify your email
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {email ? `We sent a verification link to ${email}.` : "Enter your verification token."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Dev note: until email sending is wired, the verify link is logged in the server console.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Verification token</Label>
            <Input value={token} onChange={(e) => setToken(e.target.value)} />
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <Button onClick={verifyManual} disabled={!token || status === "verifying"} className="w-full">
            {status === "verifying" ? "Verifying…" : "Verify"}
          </Button>
        </div>

        {status === "verified" ? (
          <div className="space-y-3 rounded-md border border-border bg-card px-4 py-3 text-sm">
            <div className="font-medium">Email verified.</div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => signIn(undefined, { callbackUrl: "/app" })}
            >
              Continue to sign in
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

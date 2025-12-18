"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";

export function AuthErrorClient() {
  const params = useSearchParams();
  const error = params.get("error") ?? "Something went wrong.";

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">
      <div className="mx-auto flex min-h-dvh max-w-xl items-center px-6 py-16">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-teal-300">
            <AlertTriangle className="h-5 w-5" />
            Lexus Studio
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Authentication error</h1>
          <p className="mt-2 text-sm text-white/80">
            We couldn&apos;t complete sign-in. You can retry or return home.
          </p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            <div className="text-xs uppercase tracking-wide text-white/60">Details</div>
            <div className="mt-1 break-words">{error}</div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-px hover:shadow-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-white/15"
            >
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


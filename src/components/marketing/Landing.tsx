"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth/useAuth";

export function Landing() {
  const { loading, user } = useAuth();

  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="text-sm tracking-[0.3em] uppercase text-white/70">
            Lexus
          </div>
          <div className="flex items-center gap-3">
            {loading ? null : user ? (
              <Link
                href="/app"
                className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
              >
                Open Studio
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        <main className="mt-20 grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Social Media Magic Generator
            </h1>
            <p className="mt-5 max-w-xl text-white/70">
              Generate platform-ready posts for your business in minutes. Accept
              or reject outputs with a reason — the studio learns per account so
              content gets sharper over time.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90"
              >
                Start 3-day trial
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/20 px-5 py-2.5 text-sm hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-2 gap-6 text-sm text-white/70">
              <div>
                <div className="text-white">Platforms</div>
                <div>Facebook • Instagram • Pinterest • X</div>
              </div>
              <div>
                <div className="text-white">Plan</div>
                <div>$120/mo • 1000 generations</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm text-white/70">What you get</div>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-1 size-2 rounded-full bg-white/70" />
                <span>Brand profile: niche, voice, goals, colors, logo.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 size-2 rounded-full bg-white/70" />
                <span>Generate: graphic concepts, stories, text posts, reels ideas.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 size-2 rounded-full bg-white/70" />
                <span>Libraries: Generated, Accepted, Rejected with filters.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 size-2 rounded-full bg-white/70" />
                <span>Feedback loop: accept/reject reason updates future outputs.</span>
              </li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}


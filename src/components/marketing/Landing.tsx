"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function Landing() {
  const { status, data } = useSession();
  const user = data?.user ?? null;
  const loading = status === "loading";

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-600">
            Lexus
          </div>
          <div className="flex items-center gap-3">
            {loading ? null : (
              <Link
                href={user ? "/app" : "/login"}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-px hover:shadow-md"
              >
                {user ? "Open Studio" : "Sign in"}
              </Link>
            )}
          </div>
        </header>

        <main className="mt-16 grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              AI Content Studio · Lexus
            </div>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-slate-900 md:text-5xl">
              Social Media Magic Generator
            </h1>
            <p className="mt-5 max-w-xl text-base text-slate-600">
              Generate platform-ready posts for your business in minutes. Accept or reject
              outputs with rationale — the studio learns per account so content gets sharper
              over time.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={user ? "/app" : "/login"}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:shadow-md"
              >
                {user ? "Open Studio" : "Start 3-day trial"}
              </Link>
              <Link
                href={user ? "/app" : "/login"}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-px hover:shadow-md"
              >
                {user ? "Go to app" : "Sign in"}
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-2 gap-6 text-sm text-slate-700">
              <div>
                <div className="text-slate-900 font-semibold">Platforms</div>
                <div>Facebook • Instagram • Pinterest • X</div>
              </div>
              <div>
                <div className="text-slate-900 font-semibold">Plan</div>
                <div>$120/mo • 1000 generations</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-indigo-100/60">
            <div className="text-sm font-semibold text-slate-800">What you get</div>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="mt-1 size-2 rounded-full bg-indigo-500" />
                <span>Brand profile: niche, voice, goals, colors, logo.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 size-2 rounded-full bg-indigo-500" />
                <span>Generate: graphic concepts, stories, text posts, reels ideas.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 size-2 rounded-full bg-indigo-500" />
                <span>Libraries: Generated, Accepted, Rejected with filters.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 size-2 rounded-full bg-indigo-500" />
                <span>Feedback loop: accept/reject reason updates future outputs.</span>
              </li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}

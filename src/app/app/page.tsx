"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { useSession } from "next-auth/react";

type UsageResponse = {
  ok: boolean;
  counts?: { generated: number; accepted: number; rejected: number };
  quota?:
    | {
        scope: "trial_daily";
        used: number;
        limit: number;
        resetsAt: string;
      }
    | {
        scope: "monthly";
        used: number;
        limit: number;
        monthStart: string;
        monthEnd: string;
      };
  billingStatus?: string;
  trialEndsAt?: string | null;
  trialDaysLeft?: number | null;
  error?: string;
};

export default function DashboardPage() {
  const { data } = useSession();
  const accountId = data?.accountId ?? null;
  const [usageData, setUsageData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      if (!accountId) return;
      setLoading(true);
      const res = await fetch("/api/usage", { cache: "no-store" });
      const json = (await res.json()) as UsageResponse;
      setUsageData(json);
      setLoading(false);
    }
    run();
  }, [accountId]);

  const daysLeft = usageData?.trialDaysLeft ?? null;

  const statCards = [
    {
      label: usageData?.quota?.scope === "trial_daily" ? "Trial (daily quota)" : "This month",
      value: loading ? "…" : `${usageData?.quota?.used ?? 0} / ${usageData?.quota?.limit ?? 0}`,
      helper: "Generations used",
    },
    {
      label: "Libraries",
      value: loading
        ? "…"
        : `${usageData?.counts?.generated ?? 0} • ${usageData?.counts?.accepted ?? 0} • ${usageData?.counts?.rejected ?? 0}`,
      helper: "Generated • Accepted • Rejected",
    },
    {
      label: "Access",
      value: loading ? "…" : usageData?.billingStatus ?? "trialing",
      helper: daysLeft === null ? "No trial" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`,
    },
  ];

  return (
    <div className="text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Overview</h1>
          <p className="mt-1 text-sm text-slate-600">
            Quick snapshot of your content studio. Manage generation, reviews, and billing in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/generate"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:shadow-lg"
          >
            Create content
          </Link>
          <Link
            href="/app/brand"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-px hover:shadow-md"
          >
            Brand profile
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-700">{c.label}</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{c.value}</div>
            <div className="mt-1 text-sm text-slate-500">{c.helper}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-slate-900">Platforms</div>
            <Link href="/app/generate" className="text-sm font-semibold text-teal-600 hover:text-teal-700">
              See more
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {["Facebook", "Instagram", "Pinterest", "X"].map((platform) => (
              <div
                key={platform}
                className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full bg-teal-50 text-teal-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="mt-3 text-base font-semibold text-slate-900">{platform}</div>
                <div className="mt-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {loading ? "…" : `${usageData?.counts?.generated ?? 0} items`}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-slate-900">Recent activity</div>
            <Link href="/app/library/generated" className="text-sm font-semibold text-teal-600 hover:text-teal-700">
              See more
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="h-32 bg-slate-200" />
                <div className="p-4">
                  <div className="text-xs text-slate-500">#Content • #Preview</div>
                  <div className="mt-2 text-base font-semibold text-slate-900">
                    Latest generated idea {i}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Quick look at your most recent outputs. Accept or reject to teach the AI.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-700">Account</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-teal-100 text-teal-700">
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-900">{user?.email}</div>
                <div className="text-xs text-slate-500">Lexus Studio</div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div>Status: {loading ? "…" : usageData?.billingStatus ?? "trialing"}</div>
              <div>
                Trial:{" "}
                {daysLeft === null ? "—" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/app/billing"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-px hover:shadow-md"
              >
                Billing
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-700">Recent libraries</div>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Generated</span>
                <span className="font-semibold text-slate-900">
                  {loading ? "…" : usageData?.counts?.generated ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Accepted</span>
                <span className="font-semibold text-slate-900">
                  {loading ? "…" : usageData?.counts?.accepted ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rejected</span>
                <span className="font-semibold text-slate-900">
                  {loading ? "…" : usageData?.counts?.rejected ?? 0}
                </span>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              Tip: Accept/Reject with reasons to improve personalization.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
